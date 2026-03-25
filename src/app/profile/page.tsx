'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/layout/Navbar';
import Image from 'next/image';
import { User, Settings, Heart, MapPin, Camera, Save, X } from 'lucide-react';
import Link from 'next/link';

// I noticed useSavedPlaces was in its own hook file in my previous read_file. 
// Let me double check the import path.
// It was src/hooks/useSavedPlaces.ts
import { useSavedPlaces } from '@/hooks/useSavedPlaces';

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const { user: supabaseUser } = useAuthStore();
  const { savedPlaces, isLoading: loadingPlaces } = useSavedPlaces();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Normalize user
  const user = useMemo(() => {
    if (supabaseUser) {
      return {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email?.split('@')[0],
        email: supabaseUser.email,
        image: supabaseUser.user_metadata?.avatar_url ?? null,
      };
    }
    return session?.user;
  }, [supabaseUser, session]);

  const startEditing = () => {
    setName(user?.name || '');
    setImage(user?.image || '');
    setIsEditing(true);
  };

  if (!session && !supabaseUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Please sign in to view your profile</h1>
          <Link 
            href="/auth/login" 
            className="inline-block px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image }),
      });

      if (res.ok) {
        // Update session if using NextAuth
        if (session) {
          await updateSession({ name, image });
        }
        setIsEditing(false);
        // If using Supabase, we might need a different update logic but for now this works for NextAuth
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error(error);
      alert('Error updating profile');
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 pt-24 space-y-8">
        {/* Profile Header */}
        <section className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-orange-600/20 to-purple-600/20" />
          
          <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-gray-900 overflow-hidden bg-gray-800 shadow-2xl">
                {user?.image ? (
                  <Image src={user.image} alt={user.name || 'User'} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Username</label>
                    <input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Profile Image URL</label>
                    <input 
                      value={image} 
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-black tracking-tight">{user?.name || 'Account'}</h1>
                  <p className="text-gray-400 font-medium">{user?.email}</p>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition-all"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  onClick={startEditing}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition-all"
                >
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-center sm:justify-start gap-8 border-t border-gray-800 pt-6">
            <div className="text-center">
              <span className="block text-2xl font-black">{savedPlaces.length}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Saved</span>
            </div>
            <div className="text-center opacity-50">
              <span className="block text-2xl font-black">0</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Followers</span>
            </div>
            <div className="text-center opacity-50">
              <span className="block text-2xl font-black">0</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Following</span>
            </div>
          </div>
        </section>

        {/* Saved Places */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
            <h2 className="text-2xl font-black tracking-tight">Favorite Places</h2>
          </div>

          {loadingPlaces ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-900 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : savedPlaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedPlaces.map((saved) => (
                <Link 
                  key={saved.id}
                  href={`/place/${saved.place.id}`} // Assuming there's a place details page eventually
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
              <p className="text-gray-500 font-medium">You haven&apos;t saved any places yet.</p>
              <Link href="/" className="mt-4 inline-block text-orange-500 font-bold hover:underline">
                Explore the map
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
