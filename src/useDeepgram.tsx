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
  console.log(apiKey);
  let deepgram = createClient(apiKey);

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
    setSpeaking(true);
    setRecording(true);
    let transcribed_text = "";
    const connection: any = deepgram.listen.live({
      punctuate: true,
      interim_results: true,
      encoding: "linear16",
      sample_rate: 16000,
      language: deepgramConfig?.language || "en-US",
      model: "nova-2",
      speech_final: true,
      endpointing: endpointing,
    });

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    setAudioStream(stream);
    console.log("Stream : " , stream);

    const audioContext = new AudioContext({
      sampleRate: 16000,
    });
    console.log("Audio Context : ", audioContext);
    const audioInput = audioContext.createMediaStreamSource(stream);
    const bufferSize = 2048;
    const scriptProcessorNode = audioContext.createScriptProcessor(
      bufferSize,
      1,
      1
    );

    console.log("Node : ",scriptProcessorNode);

    scriptProcessorNode.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      console.log("Audio Available");

      const output = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const sample = Math.max(-1, Math.min(1, inputData[i]));
        output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        console.log("Processing samples");
      }
      const l16Data = output.buffer;
      if(connection && connection.send){
        connection.send(l16Data);
      }else{
        console.log("Error in connection");
      }

      audioInput.connect(scriptProcessorNode);
      scriptProcessorNode.connect(audioContext.destination);
    };

    if (connection && connection.on) {
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log("Connection Open.");
        connection.on(LiveTranscriptionEvents.Close, () => {
          console.log("Connection closed.");
        });

        connection.on(LiveTranscriptionEvents.Transcript, async (data: any) => {
          if (!data) {
            console.log("Not Data");
          }
          // if (data.is_final && data.speech_final && !playing) {
          console.log(data?.channel?.alternatives[0]?.transcript);
          setTranscribing(true);
          if (data.is_final && data.speech_final) {
            const text = data?.channel?.alternatives[0]?.transcript;
            setTranscript({
              text: text,
            });
          }
          setTranscribing(false);
        });

        connection.on(LiveTranscriptionEvents.Metadata, (data: any) => {
          console.log(data);
        });

        connection.on(LiveTranscriptionEvents.Error, (err: any) => {
          console.error(err);
        });
      });
    }
  };

  const onStopRecording = async () => {
    setRecording(false);
    // onTranscribeing();
    if (audioStream) {
      await audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(audioStream);
    }
  };

  const onTranscribeing = () => {
    const text = "Anurag";
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
