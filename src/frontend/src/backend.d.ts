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
export interface UserProfile {
    bio?: string;
    displayName: string;
    socialLinks?: string;
    coverBlobId?: ExternalBlob;
}
export type Time = bigint;
export type SongId = string;
export type Uploader = Principal;
export type SongTitle = string;
export type ArtistName = string;
export interface ArtistEntry {
    principal: Principal;
    profile: UserProfile;
}
export type LoginResult = {
    __kind__: "ok";
    ok: {
        displayName: string;
        role: string;
    };
} | {
    __kind__: "err";
    err: string;
};
export interface PlatformUserRecord {
    displayName: string;
    role: string;
    banned: boolean;
    emailHash: string;
    registeredAt: Time;
}
export interface SongMetadata {
    title: SongTitle;
    likeCount: bigint;
    songId: SongId;
    year?: bigint;
    coverBlobId?: ExternalBlob;
    featuring?: string;
    genre: SongGenre;
    blobId: ExternalBlob;
    uploader: Principal;
    artist: ArtistName;
    producer?: string;
    releaseType: ReleaseType;
    uploadedAt: Time;
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
export enum Variant_ok_emailTaken {
    ok = "ok",
    emailTaken = "emailTaken"
}
// SUBSCRIPTION TYPES
export type SubscriptionPlan = {
    __kind__: "free";
} | {
    __kind__: "basic";
} | {
    __kind__: "premium";
};
export type PaymentStatus = {
    __kind__: "pending";
} | {
    __kind__: "confirmed";
} | {
    __kind__: "failed";
};
export interface SubscriptionRecord {
    emailHash: string;
    plan: SubscriptionPlan;
    startDate: Time;
    expirationDate: Time;
    autoRenew: boolean;
}
export interface PaymentRecord {
    paymentId: string;
    emailHash: string;
    plan: SubscriptionPlan;
    amount: bigint;
    paymentMethod: string;
    status: PaymentStatus;
    timestamp: Time;
    transactionRef: string;
}
export interface RevenueRecord {
    month: string;
    totalRevenue: bigint;
    artistShare: bigint;
    platformShare: bigint;
}
export interface backendInterface {
    adminDeleteSong(songId: SongId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    banPlatformUser(emailHash: string, banned: boolean): Promise<void>;
    deletePlatformUser(emailHash: string): Promise<void>;
    deleteSong(songId: SongId): Promise<void>;
    getAllPlatformUsers(): Promise<Array<PlatformUserRecord>>;
    getAllSongIds(): Promise<Array<SongId>>;
    getAllSongs(): Promise<Array<SongMetadata>>;
    getAllUserProfiles(): Promise<Array<ArtistEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProfileVisitCount(artist: Principal): Promise<bigint>;
    getSongLikes(songId: SongId): Promise<Array<Uploader>>;
    getSongMetadata(songId: SongId): Promise<SongMetadata | null>;
    getSongsByArtist(artist: string): Promise<Array<SongMetadata>>;
    getSongsByGenre(genre: SongGenre): Promise<Array<SongMetadata>>;
    getSongsByReleaseType(releaseType: ReleaseType): Promise<Array<SongMetadata>>;
    getSongsLikedByUser(): Promise<Array<SongId>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasUserLikedSong(songId: SongId): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isPlatformUserBanned(emailHash: string): Promise<boolean>;
    loginPlatformUser(emailHash: string, passwordHash: string): Promise<LoginResult>;
    recordProfileVisit(artist: Principal): Promise<void>;
    registerPlatformUser(emailHash: string, role: string, displayName: string): Promise<void>;
    registerPlatformUserWithPassword(emailHash: string, passwordHash: string, role: string, displayName: string): Promise<Variant_ok_emailTaken>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchSongs(searchTerm: string): Promise<Array<SongMetadata>>;
    toggleSongLike(songId: SongId): Promise<boolean>;
    updateProfile(displayName: string, bio: string | null, coverBlobId: ExternalBlob | null, socialLinks: string | null): Promise<void>;
    uploadSong(title: SongTitle, artist: ArtistName, genre: SongGenre, releaseType: ReleaseType, songId: SongId, audioBlob: ExternalBlob, coverBlobId: ExternalBlob | null, producer: string | null, featuring: string | null, year: bigint | null): Promise<void>;
    // Subscription functions
    getUserSubscription(emailHash: string): Promise<SubscriptionRecord | null>;
    getAllSubscriptions(): Promise<Array<SubscriptionRecord>>;
    createOrUpdateSubscription(emailHash: string, plan: SubscriptionPlan, paymentMethod: string, month: string): Promise<string>;
    confirmPayment(paymentId: string, transactionRef: string, month: string): Promise<boolean>;
    cancelSubscription(emailHash: string): Promise<void>;
    getPaymentHistory(emailHash: string): Promise<Array<PaymentRecord>>;
    getAllPayments(): Promise<Array<PaymentRecord>>;
    getRevenueStats(): Promise<Array<RevenueRecord>>;
    checkAndDowngradeExpired(currentTime: bigint): Promise<bigint>;
}
