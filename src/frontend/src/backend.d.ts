import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export type SongId = string;
export type Uploader = Principal;
export type SongTitle = string;
export type ArtistName = string;
export interface UserProfile {
    bio?: string;
    displayName: string;
    socialLinks?: string;
    coverBlobId?: ExternalBlob;
}
export interface SongMetadata {
    title: SongTitle;
    likeCount: bigint;
    songId: SongId;
    coverBlobId?: ExternalBlob;
    genre: SongGenre;
    blobId: ExternalBlob;
    uploader: Principal;
    artist: ArtistName;
    releaseType: ReleaseType;
    uploadedAt: Time;
    producer?: string;
    featuring?: string;
    year?: bigint;
}
export enum ReleaseType {
    ep = "ep",
    album = "album",
    single = "single"
}
export enum SongGenre {
    rap = "rap",
    other = "other",
    gospel = "gospel",
    kuduro = "kuduro"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteSong(songId: SongId): Promise<void>;
    getAllSongIds(): Promise<Array<SongId>>;
    getAllSongs(): Promise<Array<SongMetadata>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSongLikes(songId: SongId): Promise<Array<Uploader>>;
    getSongMetadata(songId: SongId): Promise<SongMetadata | null>;
    getSongsByArtist(artist: string): Promise<Array<SongMetadata>>;
    getSongsByGenre(genre: SongGenre): Promise<Array<SongMetadata>>;
    getSongsByReleaseType(releaseType: ReleaseType): Promise<Array<SongMetadata>>;
    getSongsLikedByUser(): Promise<Array<SongId>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasUserLikedSong(songId: SongId): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchSongs(searchTerm: string): Promise<Array<SongMetadata>>;
    toggleSongLike(songId: SongId): Promise<boolean>;
    updateProfile(displayName: string, bio: string | null, coverBlobId: ExternalBlob | null, socialLinks: string | null): Promise<void>;
    uploadSong(title: SongTitle, artist: ArtistName, genre: SongGenre, releaseType: ReleaseType, songId: SongId, audioBlob: ExternalBlob, coverBlobId: ExternalBlob | null, producer: string | null, featuring: string | null, year: bigint | null): Promise<void>;
    recordProfileVisit(artist: Principal): Promise<void>;
    getProfileVisitCount(artist: Principal): Promise<bigint>;
}
