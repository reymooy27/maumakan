'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/layout/Navbar';
import Image from 'next/image';
import { User, Heart, MapPin, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isFollowing: boolean;
  isSelf: boolean;
  _count: {
    followers: number;
    following: number;
    savedPlaces: number;
  };
  savedPlaces: Array<{
    id: string;
    place: {
      id: string;
      name: string;
      imageUrl: string | null;
      address: string | null;
      type: string;
    };
  }>;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { data: session } = useSession();
  const { user: supabaseUser } = useAuthStore();
  const isAuthenticated = !!session || !!supabaseUser;

  const { data: profile, error, mutate, isLoading } = useSWR<ProfileData>(
    userId ? `/api/user/${userId}/profile` : null,
    fetcher
  );

  const [isFollowingLoading, setIsFollowingLoading] = useState(false);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      alert('Sign in to follow users!');
      return;
    }
    
    setIsFollowingLoading(true);
    try {
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId }),
      });

      if (res.ok) {
        mutate();
      } else {
        alert('Failed to update follow status');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFollowingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error || !profile || ('error' in profile)) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center space-y-4 p-4 text-center">
        <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mb-2">
          <User className="w-10 h-10 text-gray-700" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {error ? 'Terjadi Kesalahan' : 'User tidak ditemukan'}
        </h1>
        <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium">
          {error 
            ? 'Gagal memuat profil user. Silakan coba lagi nanti.' 
            : 'Profil yang Anda cari tidak tersedia atau telah dihapus.'}
        </p>
        <Link href="/" className="mt-4 px-8 py-3 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/20 active:scale-95 transition-all">
          Kembali ke Map
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 pt-24 space-y-8">
        {/* Profile Header */}
        <section className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-orange-600/20 to-purple-600/20" />
          
          <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="w-32 h-32 rounded-full border-4 border-gray-900 overflow-hidden bg-gray-800 shadow-2xl">
              {profile.image ? (
                <Image src={profile.image} alt={profile.name || 'User'} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-600" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <h1 className="text-3xl font-black tracking-tight">{profile.name || 'Account'}</h1>
              <p className="text-gray-400 font-medium">{(profile.isSelf === true) ? profile.email : 'Public Profile'}</p>
            </div>

            <div className="flex gap-2">
              {(profile.isSelf === false) && (
                <button 
                  onClick={handleFollow}
                  disabled={isFollowingLoading}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                    profile.isFollowing 
                      ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' 
                      : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-600/20'
                  }`}
                >
                  {isFollowingLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : profile.isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
              )}
              {(profile.isSelf === true) && (
                <Link 
                  href="/profile"
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-bold transition-all"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-center sm:justify-start gap-8 border-t border-gray-800 pt-6">
            <div className="text-center">
              <span className="block text-2xl font-black">{profile._count.savedPlaces}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Saved</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-black">{profile._count.followers}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Followers</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-black">{profile._count.following}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Following</span>
            </div>
          </div>
        </section>

        {/* Saved Places */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
            <h2 className="text-2xl font-black tracking-tight">Saved by {profile.name}</h2>
          </div>

          {profile.savedPlaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.savedPlaces.map((saved) => (
                <Link 
                  key={saved.id}
                  href={`/`} // In this app we select on map
                  className="group bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-3xl p-4 flex gap-4 transition-all"
                >
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-800 flex-shrink-0">
                    {saved.place.imageUrl ? (
                      <Image src={saved.place.imageUrl} alt={saved.place.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🍽️
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h3 className="font-bold text-lg truncate">{saved.place.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {saved.place.address || 'Kupang'}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 text-[10px] font-bold rounded uppercase">
                        {saved.place.type}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-3xl p-12 text-center border-2 border-dashed border-gray-800">
              <p className="text-gray-500 font-medium">No saved places yet.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
