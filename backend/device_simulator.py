import asyncio
import websockets
import json

DEVICE_ID = "device123"
URI = "ws://localhost:8000/ws/device"

async def run():
    while True:
        try:
            async with websockets.connect(URI) as ws:

                hello = {
                    "type": "hello",
                    "deviceId": DEVICE_ID
                }

                await ws.send(json.dumps(hello))
                print("Connected as device:", DEVICE_ID)

                while True:
                    msg = await ws.recv()
                    print("Received:", msg)

        except Exception as e:
            print("Connection lost, reconnecting...", e)
            await asyncio.sleep(2)

asyncio.run(run())