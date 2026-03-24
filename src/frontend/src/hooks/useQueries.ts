import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ExternalBlob,
  ReleaseType,
  SongGenre,
  SongMetadata,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

export function useAllSongs() {
  const { actor, isFetching } = useActor();
  return useQuery<SongMetadata[]>({
    queryKey: ["songs", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSongs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSongsByGenre(genre: SongGenre) {
  const { actor, isFetching } = useActor();
  return useQuery<SongMetadata[]>({
    queryKey: ["songs", "genre", genre],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSongsByGenre(genre);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchSongs(term: string) {
  const { actor, isFetching } = useActor();
  return useQuery<SongMetadata[]>({
    queryKey: ["songs", "search", term],
    queryFn: async () => {
      if (!actor || !term) return [];
      return actor.searchSongs(term);
    },
    enabled: !!actor && !isFetching && term.length > 0,
  });
}

export function useLikedSongs() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["songs", "liked"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSongsLikedByUser();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (songId: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.toggleSongLike(songId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["songs", "liked"] });
      queryClient.invalidateQueries({ queryKey: ["songs", "all"] });
    },
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      if (!actor) throw new Error("Not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useArtistProfile(uploaderPrincipal: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["profile", "artist", uploaderPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !uploaderPrincipal) return null;
      return actor.getUserProfile(uploaderPrincipal);
    },
    enabled: !!actor && !isFetching && !!uploaderPrincipal,
  });
}

export function useArtistVisitCount(principal: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["profile", "visitCount", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return BigInt(0);
      return (actor as any).getProfileVisitCount(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useRecordProfileVisit() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) return;
      return (actor as any).recordProfileVisit(principal);
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      displayName,
      bio,
      coverBlobId,
      socialLinks,
    }: {
      displayName: string;
      bio?: string;
      coverBlobId?: ExternalBlob | null;
      socialLinks?: string | null;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateProfile(
        displayName,
        bio ?? null,
        coverBlobId ?? null,
        socialLinks ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useSongsByArtist(artist: string) {
  const { actor, isFetching } = useActor();
  return useQuery<SongMetadata[]>({
    queryKey: ["songs", "artist", artist],
    queryFn: async () => {
      if (!actor || !artist) return [];
      return actor.getSongsByArtist(artist);
    },
    enabled: !!actor && !isFetching && !!artist,
  });
}

export function useUploadSong() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      artist: string;
      genre: SongGenre;
      releaseType: ReleaseType;
      songId: string;
      audioBlob: ExternalBlob;
      coverBlobId: ExternalBlob | null;
      producer?: string | null;
      featuring?: string | null;
      year?: number | null;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.uploadSong(
        params.title,
        params.artist,
        params.genre,
        params.releaseType,
        params.songId,
        params.audioBlob,
        params.coverBlobId,
        params.producer ?? null,
        params.featuring ?? null,
        params.year != null ? BigInt(params.year) : null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
  });
}
