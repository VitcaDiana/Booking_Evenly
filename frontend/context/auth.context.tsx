'use client';

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import {api} from '@/lib/api';



interface User {
    id: number;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (access_token: string, refresh_token: string) => void;
    logout: () => void;

}

    const AuthContext = createContext<AuthContextType | null>(null);
    export function AuthProvider({children}: {children: React.ReactNode}){
        const [user, setUser] = useState<User | null>(null);
        const [loading, setLoading] = useState(true);
        const router = useRouter();

        useEffect(() => {
            const token = Cookies.get('acess_token');
            if(token){
                fetchUser(token);
            }else{
                setLoading(false);
            }
        }, []);

        const fetchUser = async(token: string) => {
            try{
                const response = await api.get('/users/me',{
                    headers: {Authorization: 'Bearer ${token}'},
                });
                setUser(response.data);
            }catch{
                Cookies.remove('acess_token');
                Cookies.remove('refresh_token');
            }finally{
                setLoading(false);
            }
        };

        const login = (access_token: string, refresh_token: string) => {
            Cookies.set('access_token', access_token, {expires: 1});
            Cookies.set('refresh_token',refresh_token,{expires: 7});

            const payload = JSON.parse(atob(access_token.split('.')[1]));
            setUser({id: payload.sub,email:payload.email});
        };

        const logout = () => {
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
            setUser(null);
            router.push('/login');
        };

        return(
            <AuthContext.Provider value= {{user, loading, login, logout}}>
                {children}
            </AuthContext.Provider>
        );
    }
    export function useAuth(){
        const context = useContext(AuthContext);
        if(!context){
            throw new Error('useAuth must be used in AuthProvider');
        }
        return context;
    }