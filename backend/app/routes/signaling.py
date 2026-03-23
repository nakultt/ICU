"""
WebRTC Signaling Server via WebSocket.

Each room can have multiple peers. Messages are forwarded
from one peer to the target peer within the same room.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json

router = APIRouter()

# rooms = { room_id: { peer_id: WebSocket } }
rooms: dict[str, dict[str, WebSocket]] = {}


@router.websocket("/ws/{room_id}/{peer_id}")
async def signaling(ws: WebSocket, room_id: str, peer_id: str):
    await ws.accept()

    # Join room
    if room_id not in rooms:
        rooms[room_id] = {}

    # Collect peer IDs already in the room BEFORE adding the new peer
    existing_peers = list(rooms[room_id].keys())

    rooms[room_id][peer_id] = ws
    print(f"[Signaling] {peer_id} joined room {room_id} ({len(rooms[room_id])} peers)")

    # Tell the NEW peer about everyone already in the room
    if existing_peers:
        await ws.send_text(json.dumps({
            "type": "room-peers",
            "peers": existing_peers,
        }))

    # Notify all EXISTING peers that a new peer joined
    for pid in existing_peers:
        peer_ws = rooms[room_id].get(pid)
        if peer_ws:
            try:
                await peer_ws.send_text(json.dumps({
                    "type": "peer-joined",
                    "peerId": peer_id,
                }))
            except Exception:
                pass

    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            target = msg.get("target")

            if target and room_id in rooms and target in rooms[room_id]:
                # Forward the message to the specific target peer
                await rooms[room_id][target].send_text(data)
            elif not target:
                # Broadcast to all other peers in the room
                for pid, peer_ws in rooms[room_id].items():
                    if pid != peer_id:
                        try:
                            await peer_ws.send_text(data)
                        except Exception:
                            pass

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[Signaling] Error for {peer_id} in {room_id}: {e}")
    finally:
        # Leave room
        if room_id in rooms:
            rooms[room_id].pop(peer_id, None)
            # Notify remaining peers
            for pid, peer_ws in rooms[room_id].items():
                try:
                    await peer_ws.send_text(json.dumps({
                        "type": "peer-left",
                        "peerId": peer_id,
                    }))
                except Exception:
                    pass
            # Clean up empty rooms
            if not rooms[room_id]:
                del rooms[room_id]
        print(f"[Signaling] {peer_id} left room {room_id}")
