import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { Place } from '@/types';

export interface SavedPlace {
  id: string;
  userId: string;
  placeId: string;
  createdAt: string;
  place: Place;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useSavedPlaces() {
  const { data: session } = useSession();
  
  const { data, error, mutate } = useSWR<SavedPlace[]>(
    session?.user ? '/api/user/saved-places' : null,
    fetcher
  );

  const toggleSave = async (placeId: string) => {
    if (!session?.user) {
      // Must be logged in to save
      return false;
    }

    // Optimistic update
    const previous = data;
    const isSaved = data?.some(s => s.placeId === placeId);
    
    if (isSaved) {
      mutate(data!.filter(s => s.placeId !== placeId), false);
    } else {
      // Mock the saved place locally until refresh
      mutate([...(data || []), { placeId } as SavedPlace], false);
    }

    try {
      const res = await fetch('/api/user/saved-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId }),
      });
      if (!res.ok) throw new Error('Failed to toggle bookmark');
      mutate();
      return true;
    } catch {
      mutate(previous); // Revert on failure
      return false;
    }
  };

  const isSaved = (placeId: string) => {
    return data?.some(s => s.placeId === placeId) ?? false;
  };

  return {
    savedPlaces: data || [],
    isLoading: !error && !data && !!session?.user,
    isError: error,
    toggleSave,
    isSaved
  };
}
