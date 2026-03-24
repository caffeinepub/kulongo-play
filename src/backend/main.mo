import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Set "mo:core/Set";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Option "mo:core/Option";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";



actor {
  module SongEntry {
    public func compare(song1 : SongEntry, song2 : SongEntry) : Order.Order {
      Text.compare(song1.songId, song2.songId);
    };
  };

  // TYPES
  type ArtistName = Text;
  type SongId = Text;
  type Uploader = Principal;
  type SongTitle = Text;

  type ReleaseType = {
    #single;
    #ep;
    #album;
  };

  type SongGenre = {
    #kuduro;
    #rap;
    #gospel;
    #other;
  };

  // Original SongEntry type (unchanged for stable compatibility)
  type SongEntry = {
    songId : SongId;
    title : SongTitle;
    artist : ArtistName;
    genre : SongGenre;
    releaseType : ReleaseType;
    blobId : Storage.ExternalBlob;
    coverBlobId : ?Storage.ExternalBlob;
    uploadedAt : Time.Time;
    uploader : Principal;
  };

  // Extra metadata stored separately to preserve stable variable compatibility
  type SongExtras = {
    producer : ?Text;
    featuring : ?Text;
    year : ?Nat;
  };

  type SongMetadata = {
    songId : SongId;
    title : SongTitle;
    artist : ArtistName;
    genre : SongGenre;
    releaseType : ReleaseType;
    blobId : Storage.ExternalBlob;
    coverBlobId : ?Storage.ExternalBlob;
    uploadedAt : Time.Time;
    uploader : Principal;
    likeCount : Nat;
    producer : ?Text;
    featuring : ?Text;
    year : ?Nat;
  };

  type UserProfile = {
    displayName : Text;
    bio : ?Text;
    coverBlobId : ?Storage.ExternalBlob;
    socialLinks : ?Text;
  };

  // MAPS AND SETS
  let songs = Map.empty<SongId, SongEntry>();

  // New separate map for extra song metadata (compatible with existing stable data)
  let songExtras = Map.empty<SongId, SongExtras>();

  let songLikes = Map.empty<SongId, Set.Set<Uploader>>();

  let userProfiles = Map.empty<Uploader, UserProfile>();

  let profileVisits = Map.empty<Uploader, Nat>();

  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Helper to build SongMetadata from entry + extras
  func buildMetadata(songEntry : SongEntry, likeCount : Nat) : SongMetadata {
    let extras = switch (songExtras.get(songEntry.songId)) {
      case (null) { { producer = null; featuring = null; year = null } };
      case (?e) { e };
    };
    {
      songId = songEntry.songId;
      title = songEntry.title;
      artist = songEntry.artist;
      genre = songEntry.genre;
      releaseType = songEntry.releaseType;
      blobId = songEntry.blobId;
      coverBlobId = songEntry.coverBlobId;
      uploadedAt = songEntry.uploadedAt;
      uploader = songEntry.uploader;
      likeCount;
      producer = extras.producer;
      featuring = extras.featuring;
      year = extras.year;
    };
  };

  func getLikeCount(songId : SongId) : Nat {
    switch (songLikes.get(songId)) {
      case (null) { 0 };
      case (?likesSet) { likesSet.size() };
    };
  };

  // SONG MANAGEMENT

  public query ({ caller }) func getAllSongIds() : async [SongId] {
    songs.keys().toArray();
  };

  public shared ({ caller }) func uploadSong(
    title : SongTitle,
    artist : ArtistName,
    genre : SongGenre,
    releaseType : ReleaseType,
    songId : SongId,
    audioBlob : Storage.ExternalBlob,
    coverBlobId : ?Storage.ExternalBlob,
    producer : ?Text,
    featuring : ?Text,
    year : ?Nat,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload songs");
    };
    let newSongEntry : SongEntry = {
      songId;
      title;
      artist;
      genre;
      releaseType;
      blobId = audioBlob;
      coverBlobId;
      uploadedAt = Time.now();
      uploader = caller;
    };
    songs.add(songId, newSongEntry);
    songExtras.add(songId, { producer; featuring; year });
    if (not songLikes.containsKey(songId)) {
      songLikes.add(songId, Set.empty<Principal>());
    };
  };

  public query ({ caller }) func getSongMetadata(songId : SongId) : async ?SongMetadata {
    songs.get(songId).map(
      func(songEntry) {
        buildMetadata(songEntry, getLikeCount(songId));
      }
    );
  };

  public query ({ caller }) func getAllSongs() : async [SongMetadata] {
    songs.values().toArray().map(func(songEntry) {
      buildMetadata(songEntry, getLikeCount(songEntry.songId));
    });
  };

  public query ({ caller }) func getSongsByGenre(genre : SongGenre) : async [SongMetadata] {
    songs.values().toArray().filter(
      func(songEntry) { songEntry.genre == genre; }
    ).map(func(songEntry) {
      buildMetadata(songEntry, getLikeCount(songEntry.songId));
    });
  };

  public query ({ caller }) func getSongsByReleaseType(releaseType : ReleaseType) : async [SongMetadata] {
    songs.values().toArray().filter(
      func(songEntry) { songEntry.releaseType == releaseType; }
    ).map(func(songEntry) {
      buildMetadata(songEntry, getLikeCount(songEntry.songId));
    });
  };

  public query ({ caller }) func getSongsByArtist(artist : Text) : async [SongMetadata] {
    songs.values().toArray().filter(
      func(songEntry) { songEntry.artist.contains(#text artist); }
    ).map(func(songEntry) {
      buildMetadata(songEntry, getLikeCount(songEntry.songId));
    });
  };

  // LIKE FUNCTIONALITY
  public shared ({ caller }) func toggleSongLike(songId : SongId) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like songs");
    };
    let currentLikes = switch (songLikes.get(songId)) {
      case (null) { Set.empty<Principal>() };
      case (?likesSet) { likesSet };
    };
    let newLikes = if (currentLikes.contains(caller)) {
      currentLikes.remove(caller);
      false;
    } else {
      currentLikes.add(caller);
      true;
    };
    if (newLikes) {
      assert songLikes.containsKey(songId);
    };
    songLikes.add(songId, currentLikes);
    newLikes;
  };

  public query ({ caller }) func hasUserLikedSong(songId : SongId) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check their likes");
    };
    switch (songLikes.get(songId)) {
      case (null) { false };
      case (?likesSet) { likesSet.contains(caller) };
    };
  };

  public query ({ caller }) func getSongLikes(songId : SongId) : async [Uploader] {
    switch (songLikes.get(songId)) {
      case (null) { [] };
      case (?likesSet) { likesSet.toArray() };
    };
  };

  public query ({ caller }) func getSongsLikedByUser() : async [SongId] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their liked songs");
    };
    songLikes.toArray().filter(
      func((songId, likesSet)) { likesSet.contains(caller); }
    ).map(
      func((songId, _)) { songId; }
    );
  };

  // USER PROFILE MANAGEMENT
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func updateProfile(displayName : Text, bio : ?Text, coverBlobId : ?Storage.ExternalBlob, socialLinks : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };
    userProfiles.add(caller, { displayName; bio; coverBlobId; socialLinks });
  };

  // PROFILE VISIT TRACKING
  public shared ({ caller }) func recordProfileVisit(artist : Principal) : async () {
    let current = switch (profileVisits.get(artist)) {
      case (null) { 0 };
      case (?n) { n };
    };
    profileVisits.add(artist, current + 1);
  };

  public query ({ caller }) func getProfileVisitCount(artist : Principal) : async Nat {
    switch (profileVisits.get(artist)) {
      case (null) { 0 };
      case (?n) { n };
    };
  };

  // SEARCH FUNCTIONALITY
  public query ({ caller }) func searchSongs(searchTerm : Text) : async [SongMetadata] {
    songs.values().toArray().filter(
      func(songEntry) {
        songEntry.title.contains(#text searchTerm) or songEntry.artist.contains(#text searchTerm);
      }
    ).map(func(songEntry) {
      buildMetadata(songEntry, getLikeCount(songEntry.songId));
    });
  };

  // DELETE SONG
  public shared ({ caller }) func deleteSong(songId : SongId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete songs");
    };
    switch (songs.get(songId)) {
      case (null) { Runtime.trap("Song not found"); };
      case (?songEntry) {
        if (songEntry.uploader != caller) {
          Runtime.trap("Unauthorized: Must be the owner to delete the song");
        };
      };
    };
    songs.remove(songId);
    songExtras.remove(songId);
    songLikes.remove(songId);
  };
};
