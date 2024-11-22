// src/types/socket.io-client.d.ts
// declare module 'socket.io-client' {
//   const io: any;
//   export { io };
// }

declare var io : {
  connect(url: string): Socket;
};
interface Socket {
  on(event: string, callback: (data: any) => void );
  emit(event: string, data: any);
}