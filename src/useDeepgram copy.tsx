import {
  UseDeepgramConfig,
  UseDeepgramHook,
  useDeepgramTranscript,
  defaultStopTimeout,
} from "./types";
import {
  createClient,
  CONNECTION_STATE,
  LiveTranscriptionEvents,
  ListenLiveClient,
} from "@deepgram/sdk";

import { useEffect, useRef, useState } from "react";

const defaultConfig: UseDeepgramConfig = {
  apiKey: "",
  autoStart: false,
  endpointing: defaultStopTimeout,
  onDataAvailable: undefined,
  onTranscribe: undefined,
};

const defaultTranscript: useDeepgramTranscript = {
  text: "",
};

export const useDeepgram: UseDeepgramHook = (config) => {
  const { apiKey, autoStart, endpointing, deepgramConfig } = {
    ...defaultConfig,
    ...config,
  };
  // let deepgram = createClient(apiKey);

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
    // let transcribed_text = "";
    // const connection = deepgram.listen.live({
    //   punctuate: true,
    //   interim_results: true,
    //   encoding: "linear16",
    //   sample_rate: 16000,
    //   language: deepgramConfig?.language || "en-US",
    //   model: "nova-2",
    //   speech_final: true,
    //   endpointing: endpointing,
    // });

    const DEEPGRAM_API_URL = "wss://api.deepgram.com/v1/listen";
    console.log("Apki Key : ", apiKey);
    const socket = new WebSocket(DEEPGRAM_API_URL, ["token", apiKey]);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    setAudioStream(stream);

    socket.onopen = () => {
      console.log({ event: "onopen" });

      const audioContext = new AudioContext({
        sampleRate: 16000,
      });
      console.log("Fetching audio.");
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
        if (socket.readyState == 1) {
          socket.send(l16Data);
          console.log("Sending data");
        }
        else{
          console.log("Socket not open");
        }
        audioInput.connect(scriptProcessorNode);
        scriptProcessorNode.connect(audioContext.destination);
      };
      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel.alternatives[0].transcript;

        console.log("Transcript : ", transcript);
        onTranscribeing(transcript);
      };
    };

    socket.onerror = (error) => {
      console.error("WebSocket error: ", error);
    };

    socket.onclose = (event) => {
      console.log("WebSocket closed: ", event);
    };
  };

  const onStopRecording = async () => {
    setRecording(false);
    if (audioStream) {
      await audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(audioStream);
    }
  };

  const onTranscribeing = (text: string) => {
    setTranscript({
      text,
    });
  };

  return {
    recording,
    speaking,
    transcribing,
    transcript,
    startRecording,
    stopRecording,
  };
};
