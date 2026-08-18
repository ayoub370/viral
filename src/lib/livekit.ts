import { Room, RoomEvent, Track, Participant, DataPacket_Kind } from 'livekit-client';
import { supabase } from './api';

const DEFAULT_LIVEKIT_WS_URL = 'wss://viewcoin-vmvuj9mm.livekit.cloud';

export interface LiveKitJoinConfig {
  roomID: string;
  userID: string;
  userName: string;
  canPublish: boolean;
  onParticipantConnected?: (count: number) => void;
  onParticipantDisconnected?: (count: number) => void;
  onDataMessage?: (msg: { sender: string; message: string; type: string }) => void;
  onTrackSubscribed?: (track: Track, participant: Participant) => void;
}

async function fetchLiveKitToken(
  roomID: string,
  userID: string,
  userName: string,
  canPublish: boolean
): Promise<{ token: string; url: string }> {
  const { data, error } = await supabase.functions.invoke('livekit-token', {
    body: {
      room: roomID,
      identity: userID,
      name: userName,
      canPublish,
      canSubscribe: true,
    },
  });

  if (error || !data?.token) {
    throw new Error(error?.message || 'Impossible de récupérer le jeton LiveKit');
  }

  return {
    token: data.token as string,
    url: (data.url as string) || DEFAULT_LIVEKIT_WS_URL,
  };
}

export async function joinLiveKitRoom(config: LiveKitJoinConfig): Promise<Room> {
  const { token, url } = await fetchLiveKitToken(
    config.roomID,
    config.userID,
    config.userName,
    config.canPublish
  );

  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
  });

  await room.connect(url, token);

  // Track participant count
  const updateCount = () => {
    const count = room.participants.size + 1; // +1 for local participant
    config.onParticipantConnected?.(count);
  };
  updateCount();

  room.on(RoomEvent.ParticipantConnected, () => updateCount());
  room.on(RoomEvent.ParticipantDisconnected, () => {
    const count = room.participants.size + 1;
    config.onParticipantDisconnected?.(count);
  });

  room.on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
    try {
      const decoded = new TextDecoder().decode(payload);
      const msg = JSON.parse(decoded);
      config.onDataMessage?.({
        sender: msg.username || participant?.identity || 'Anonyme',
        message: msg.message || '',
        type: msg.type || topic || 'chat',
      });
    } catch {}
  });

  room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
    config.onTrackSubscribed?.(track, participant);
  });

  return room;
}

export async function leaveLiveKitRoom(room: Room): Promise<void> {
  await room.disconnect();
}

export function publishLocalCamera(room: Room): Promise<void> {
  return room.localParticipant.setCameraEnabled(true);
}

export function publishLocalMic(room: Room): Promise<void> {
  return room.localParticipant.setMicrophoneEnabled(true);
}

export function disableLocalCamera(room: Room): Promise<void> {
  return room.localParticipant.setCameraEnabled(false);
}

export function disableLocalMic(room: Room): Promise<void> {
  return room.localParticipant.setMicrophoneEnabled(false);
}

export async function sendChatMessage(
  room: Room,
  message: string,
  username: string
): Promise<void> {
  const payload = new TextEncoder().encode(
    JSON.stringify({ type: 'chat', username, message })
  );
  await room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE);
}

export async function sendLike(room: Room, username: string): Promise<void> {
  const payload = new TextEncoder().encode(
    JSON.stringify({ type: 'like', username, message: '' })
  );
  await room.localParticipant.publishData(payload, DataPacket_Kind.LOSSY);
}

export async function sendGift(
  room: Room,
  username: string,
  giftName: string
): Promise<void> {
  const payload = new TextEncoder().encode(
    JSON.stringify({ type: 'gift', username, message: giftName })
  );
  await room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE);
}
