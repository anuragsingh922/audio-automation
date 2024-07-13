export type UseDeepgramConfig = {
  apiKey?: string
  autoStart?: boolean
  endpointing?: number
  deepgramConfig?: DeepgramApiConfig
  onDataAvailable?: (blob: Blob) => void
  onTranscribe?: (blob: Blob) => Promise<useDeepgramTranscript>
}

export const defaultStopTimeout = 5_000;

export type useDeepgramTranscript = {
  text?: string
}

export type useDeepgramReturn = {
  recording: boolean
  speaking: boolean
  transcribing: boolean
  transcript: useDeepgramTranscript
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
}

export type UseDeepgramHook = (config?: UseDeepgramConfig) => useDeepgramReturn

export type DeepgramApiConfig = {
  model?: 'nova-2' | string
  prompt?: string
  response_format?: 'text'
  language?: string
  encoding?: string
  punctuate?: true,
  interim_results?: true,
  sample_rate: number,
}
