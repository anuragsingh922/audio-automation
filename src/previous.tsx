import {
    UseDeepgramConfig,
    UseDeepgramHook,
    useDeepgramTranscript,
    defaultStopTimeout,
  } from "./types";
  import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
  
  import { useEffect, useRef, useState } from "react";
  
  const defaultConfig: UseDeepgramConfig = {
    apiKey: "",
    autoStart: false,
    endpointing: defaultStopTimeout,
    onDataAvailable: undefined,
    onTranscribe: undefined,
  };
  
  const defaultTranscript: useDeepgramTranscript = {
    text: undefined,
  };
  
  export const useDeepgram: UseDeepgramHook = (config) => {
    let deepgram = createClient("9f8db5f4f4387b8deb153dd208c953413630f60e");
    const {
      apiKey,
      autoStart,
      endpointing,
      deepgramConfig,
      onDataAvailable: onDataAvailableCallback,
      onTranscribe: onTranscribeCallback,
    } = {
      ...defaultConfig,
      ...config,
    };
  
    const [recording, setRecording] = useState<boolean>(false);
    const [speaking, setSpeaking] = useState<boolean>(false);
    const [transcribing, setTranscribing] = useState<boolean>(false);
    const [audioStream, setAudioStream] = useState<MediaStream>();
    const [transcript, setTranscript] =
      useState<useDeepgramTranscript>(defaultTranscript);
  
    /**
     * start speech recording and start listen for speaking event
     */
    const startRecording = async () => {
      await onStartRecording();
    };
  
    const stopRecording = async () => {
      await onStopRecording();
    };
  
    const onStartRecording = async () => {
      setRecording(true);
      let connection = deepgram.listen.live({
        punctuate: true,
        interim_results: true,
        encoding: "linear16",
        sample_rate: 16000,
        language: deepgramConfig?.language || "en-US",
        model: "nova-2",
        speech_final: true,
      });
  
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
      setAudioStream(stream);
  
      const audioContext = new AudioContext({
        sampleRate: 16000,
      });
      const audioInput = audioContext.createMediaStreamSource(stream);
      const bufferSize = 2048;
      const scriptProcessorNode = audioContext.createScriptProcessor(
        bufferSize,
        1,
        1
      );
  
      scriptProcessorNode.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
  
        const output = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const sample = Math.max(-1, Math.min(1, inputData[i]));
          output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        }
        const l16Data = output.buffer;
  
        audioInput.connect(scriptProcessorNode);
        scriptProcessorNode.connect(audioContext.destination);
      };
    };
  
    const onStopRecording = async () => {
      setRecording(false);
      onTranscribeing();
      if (audioStream) {
        await audioStream.getTracks().forEach((track) => track.stop());
        setAudioStream(audioStream);
      }
    };
  
    const onTranscribeing = ()=>{
      const text = "Anurag";
      setTranscript({
          text,
        })
    }
  
    return {
      recording,
      speaking,
      transcribing,
      transcript,
      startRecording,
      stopRecording,
    }
  };
  