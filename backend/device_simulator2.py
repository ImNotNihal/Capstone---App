import asyncio
import websockets
import json
import time

DEVICE_ID = "device123"
URI = "ws://localhost:8000/ws/device"

async def run():
    async with websockets.connect(URI) as ws:

        hello = {
            "type": "hello",
            "deviceId": DEVICE_ID
        }

        await ws.send(json.dumps(hello))
        print("Device registered")

        # listen for commands while also sending events
        while True:

            # send a simulated event
            event = {
                "type": "event",
                "deviceId": DEVICE_ID,
                "eventType": "motion_detected",
                "message": "Motion detected near front door",
                "timestamp": int(time.time())
            }

            await ws.send(json.dumps(event))
            print("Sent event:", event)

            await asyncio.sleep(10)

asyncio.run(run())