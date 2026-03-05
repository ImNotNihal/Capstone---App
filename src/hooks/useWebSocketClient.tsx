// import {useCallback} from "react";
//
// export function useServerClient() {
//
//     const httpLock = (base_url, deviceId) => {
//         const url = `${base_url}send-command/${deviceId}/LOCK`;
//         return fetch(url, {method: "POST"});
//     };
//
//     const httpUnlock = (base_url, deviceId) => {
//         const url = `${base_url}send-command/${deviceId}/UNLOCK`;
//         return fetch(url, {method: "POST"});
//     };
//
//     const httpGetLockStatus = (base_url, deviceId, setIsLocked) => {
//         const url = `${base_url}status/${deviceId}`;
//         return fetch(url, {method: "GET"})
//             .then((response) => response.json())
//             .then((data) => {
//                 const status = data?.status;
//                 if (typeof status === "string") {
//                     setIsLocked(status === "LOCKED");
//                 }
//                 return data;
//             })
//             .catch((e) => {
//                 console.log("Status fetch error:", e);
//             });
//     };
//
//     const initWebSocket = useCallback(async (base_url, wsRef, deviceId, setIsLocked,) => {
//         // -------- WebSocket for realtime status from server --------
//         const wsUrl = (base_url || "")
//             .replace(/^http:\/\//, "ws://")
//             .replace(/^https:\/\//, "wss://") + "ws/client";
//
//         console.log("Connecting WS client to:", wsUrl);
//
//         if (wsRef.current) {
//             wsRef.current.close();
//             wsRef.current = null;
//         }
//
//         const ws = new WebSocket(wsUrl);
//         wsRef.current = ws;
//
//         ws.onopen = () => {
//             console.log("Client WS connected");
//             // Subscribe to this device's status feed
//             const subMsg = JSON.stringify({
//                 type: "subscribe",
//                 deviceId: deviceId,
//             });
//             ws.send(subMsg);
//
//             // Optionally fetch status once via HTTP as initial value
//             httpGetLockStatus(base_url, deviceId, setIsLocked);
//         };
//
//         ws.onmessage = (event) => {
//             try {
//                 const data = JSON.parse(event.data);
//                 // Expect messages like:
//                 // { type: "status", deviceId: "...", status: "LOCKED" }
//                 if (data.type === "status" && data.deviceId === deviceId) {
//                     if (typeof data.status === "string") {
//                         setIsLocked(data.status === "LOCKED");
//                     }
//                 }
//             } catch (e) {
//                 console.log("WS message parse error:", e);
//             }
//         };
//
//         ws.onerror = (event) => {
//             console.log("WS error:", event);
//         };
//
//         ws.onclose = (event) => {
//             console.log("Client WS closed:", event?.code, event?.reason);
//             wsRef.current = null;
//         };
//
//         return () => {
//             console.log("Cleaning up WS");
//             if (wsRef.current) {
//                 wsRef.current.close();
//                 wsRef.current = null;
//             }
//         };
//     });
//    
//     return {httpLock, httpUnlock, initWebSocket};
// }
//
