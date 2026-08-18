import { supabase } from "./api";

export interface LiveRecord {
  id: string;
  room_id: string;
  host_id: string;
  host_username: string | null;
  host_avatar_url: string | null;
  status: string;
  title: string | null;
  category: string | null;
  viewer_count: number;
  total_viewers: number;
  started_at: string;
  ended_at: string | null;
}

export function generateRoomID(userID: string): string {
  return `live_${userID}_${Date.now()}`;
}

export async function createLiveRecord(
  roomID: string,
  hostID: string,
  hostUsername: string,
  hostAvatarUrl?: string,
  title?: string,
  category?: string
): Promise<LiveRecord | null> {
  const { data, error } = await supabase
    .from("lives")
    .insert({
      room_id: roomID,
      host_id: hostID,
      host_username: hostUsername,
      host_avatar_url: hostAvatarUrl,
      title,
      category,
      status: "live",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create live record:", error);
    return null;
  }
  return data as LiveRecord;
}

export async function endLiveRecord(roomID: string): Promise<void> {
  const { error } = await supabase
    .from("lives")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("room_id", roomID);
  if (error) console.error("Failed to end live record:", error);
}

export async function updateViewerCount(roomID: string, count: number): Promise<void> {
  const { error } = await supabase
    .from("lives")
    .update({ viewer_count: count })
    .eq("room_id", roomID);
  if (error) console.error("Failed to update viewer count:", error);
}

export async function fetchActiveLives(): Promise<LiveRecord[]> {
  const { data, error } = await supabase
    .from("lives")
    .select("*")
    .eq("status", "live")
    .order("started_at", { ascending: false });
  if (error) {
    console.error("Failed to fetch active lives:", error);
    return [];
  }
  return (data || []) as LiveRecord[];
}

export async function fetchLiveByRoomID(roomID: string): Promise<LiveRecord | null> {
  const { data, error } = await supabase
    .from("lives")
    .select("*")
    .eq("room_id", roomID)
    .eq("status", "live")
    .single();
  if (error) return null;
  return data as LiveRecord;
}
