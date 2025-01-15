import {create} from 'zustand'
import { axiosInstance } from '../lib/axios'
import toast from 'react-hot-toast';
import {io} from 'socket.io-client';

const BASE_URL=import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore=create((set,get)=>({
    authUser:null,
    isSigningUp:false,
    isLoggingIn:false,
    isUpdatingProfile:false,
    isCheckingAuth:true,
    onlineUsers:[],
    socket:null,

    checkAuth:async()=>{
        try {
            const res=await axiosInstance.get("/auth/check");

            set({authUser:res.data});
            get().connectSocket();
        } catch (error) {
            console.log("Error in checkAuth",error)
            set({authUser:null})
        }
        finally{
            set({isCheckingAuth:false})
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
          const res = await axiosInstance.post("/auth/signup", data);
          set({ authUser: res.data });
          toast.success("Account created successfully");
          get().connectSocket();
        } catch (error) {
          toast.error(error.response.data.message);
        } finally {
          set({ isSigningUp: false });
        }
      },

      login: async (data) => {
        set({ isLoggingIn: true });
        try {
          const res = await axiosInstance.post("/auth/login", data);
          set({ authUser: res.data });
          toast.success("Logged in successfully");
    
          get().connectSocket();
        } catch (error) {
          toast.error(error.response.data.message);
        } finally {
          set({ isLoggingIn: false });
        }
      },

    logout: async()=>{

        try {
            await axiosInstance.post("/auth/logout");
            set({authUser:null});
            toast.success("Logged out successfully");
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    updateProfile: async (data) => {
      set({isUpdatingProfile:true});
      try {
        const res=await axiosInstance.put("/auth/update-profile",data);
        set({authUser:res.data});
        toast.success("Profile updated successfully");
      } catch (error) {
        console.log("error in update profile:",error)
        toast.error(error.response.data.message);
        
      }finally{
        set({isUpdatingProfile:false})
      }
    },

    // connectSocket:()=>{
    //   const {authUser}=get()
    //   if(!authUser || get().socket.connected) return;

    //   const socket=io(BASE_URL,{
    //     query:{
    //       userId:authUser._id,
    //     },
    //   });
    //   socket.connect();
      
    //   set({socket:socket});

    //   socket.on("getOnlineUsers",(userIds)=>{
    //     set({onlineUsers:userIds})
    //   });
    // },
    // disconnectSocket:()=>{
    //   if(get().socket?.connected) get().socket.disconnect();
    // }
    // connectSocket: () => {
    //   const { authUser, socket } = get();
    
    //   // Check if user is authenticated and socket is not already connected
    //   if (!authUser || (socket && socket.connected)) return;
    
    //   // Initialize the socket
    //   const newSocket = io(BASE_URL);
    
    //   // Log connection status on the client for debugging
    //   newSocket.on("connect", () => {
    //     console.log("Connected to server with socket ID:", newSocket.id);
    //   });
    
    //   // Handle disconnection
    //   newSocket.on("disconnect", () => {
    //     console.log("Disconnected from server with socket ID:", newSocket.id);
    //   });
    
    //   set({ socket: newSocket });
    // },
    
    // disconnectSocket: () => {
    //   const { socket } = get();
    
    //   if (socket && socket.connected) {
    //     console.log("Disconnecting socket with ID:", socket.id);
    //     socket.disconnect();
    //   }
    // },

    connectSocket: () => {
      const { authUser, socket } = get();
    
      // Check if user is authenticated and socket is not already connected
      if (!authUser || (socket && socket.connected)) return;
    
      // Initialize the socket with userId as a query parameter
      const newSocket = io(BASE_URL, {
        query: {
          userId: authUser._id, // Sending userId to the server
        },
      });
    
      // Log connection status on the client for debugging
      newSocket.on("connect", () => {
        console.log("Connected to server with socket ID:", newSocket.id);
      });
    
      // Handle disconnection
      newSocket.on("disconnect", () => {
        console.log("Disconnected from server with socket ID:", newSocket.id);
      });
    
      // Handle custom server event to update online users
      newSocket.on("getOnlineUsers", (userIds) => {
        console.log("Online users received from server:", userIds);
        set({ onlineUsers: userIds }); // Update the onlineUsers state
      });
    
      // Save the socket instance to the store
      set({ socket: newSocket });
    },
    
    disconnectSocket: () => {
      const { socket } = get();
    
      if (socket && socket.connected) {
        console.log("Disconnecting socket with ID:", socket.id);
        socket.disconnect();
      }
    },
    
    
    


}))