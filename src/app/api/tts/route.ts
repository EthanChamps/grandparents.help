import { NextRequest, NextResponse } from 'next/server'
import { getGemini } from '@/lib/gemini'

const TTS_MODEL = 'gemini-2.5-flash-preview-tts'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Strip markdown for cleaner speech
    const plainText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`/g, '')
      .replace(/\n+/g, ' ')
      .trim()

    const ai = getGemini()

    // Retry logic for unstable Gemini TTS preview
    let lastError: Error | null = null
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: TTS_MODEL,
          contents: [{ parts: [{ text: plainText }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        })

        // Extract audio data
        const candidate = response.candidates?.[0]
        const audioPart = candidate?.content?.parts?.[0]

        if (!audioPart || !('inlineData' in audioPart) || !audioPart.inlineData?.data) {
          throw new Error('No audio generated')
        }

        const audioBase64 = audioPart.inlineData.data
        const pcmBuffer = Buffer.from(audioBase64, 'base64')
        const wavBuffer = createWavBuffer(pcmBuffer, 24000, 1, 16)

        return new NextResponse(new Uint8Array(wavBuffer), {
          headers: {
            'Content-Type': 'audio/wav',
            'Content-Length': wavBuffer.length.toString(),
          },
        })
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.warn(`TTS attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message)

        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY * attempt) // Exponential backoff
        }
      }
    }

    // All retries failed
    throw lastError || new Error('TTS generation failed')
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    )
  }
}

// Create WAV file buffer from raw PCM data
function createWavBuffer(
  pcmData: Buffer,
  sampleRate: number,
  numChannels: number,
  bitsPerSample: number
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataSize = pcmData.length
  const headerSize = 44
  const fileSize = headerSize + dataSize - 8

  const buffer = Buffer.alloc(headerSize + dataSize)

  // RIFF header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(fileSize, 4)
  buffer.write('WAVE', 8)

  // fmt chunk
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16) // fmt chunk size
  buffer.writeUInt16LE(1, 20) // audio format (PCM)
  buffer.writeUInt16LE(numChannels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitsPerSample, 34)

  // data chunk
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  pcmData.copy(buffer, 44)

  return buffer
}
