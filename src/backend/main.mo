import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Set "mo:core/Set";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
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

  type ArtistEntry = {
    principal : Principal;
    profile : UserProfile;
  };

  // Unchanged type — compatible with existing stable data
  type PlatformUserRecord = {
    emailHash : Text;
    role : Text;
    displayName : Text;
    banned : Bool;
    registeredAt : Time.Time;
  };

  type LoginResult = {
    #ok : { role : Text; displayName : Text };
    #err : Text;
  };

  // SUBSCRIPTION TYPES
  type SubscriptionPlan = {
    #free;
    #basic;
    #premium;
  };

  type PaymentStatus = {
    #pending;
    #confirmed;
    #failed;
  };

  type SubscriptionRecord = {
    emailHash : Text;
    plan : SubscriptionPlan;
    startDate : Time.Time;
    expirationDate : Time.Time;
    autoRenew : Bool;
  };

  type PaymentRecord = {
    paymentId : Text;
    emailHash : Text;
    plan : SubscriptionPlan;
    amount : Nat;
    paymentMethod : Text;
    status : PaymentStatus;
    timestamp : Time.Time;
    transactionRef : Text;
  };

  type RevenueRecord = {
    month : Text;
    totalRevenue : Nat;
    artistShare : Nat;
    platformShare : Nat;
  };

  // MAPS AND SETS
  let songs = Map.empty<SongId, SongEntry>();
  let songExtras = Map.empty<SongId, SongExtras>();
  let songLikes = Map.empty<SongId, Set.Set<Uploader>>();
  let userProfiles = Map.empty<Uploader, UserProfile>();
  let profileVisits = Map.empty<Uploader, Nat>();
  let platformUsers = Map.empty<Text, PlatformUserRecord>();
  // Separate map for passwords — keeps PlatformUserRecord type unchanged (no migration needed)
  let platformPasswords = Map.empty<Text, Text>(); // emailHash -> passwordHash

  // SUBSCRIPTION MAPS
  let subscriptions = Map.empty<Text, SubscriptionRecord>();
  let payments = Map.empty<Text, PaymentRecord>();
  let revenues = Map.empty<Text, RevenueRecord>();

  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);
  include MixinStorage();

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
    let currentLikes = switch (songLikes.get(songId)) {
      case (null) { Set.empty<Principal>() };
      case (?likesSet) { likesSet };
    };
    let isLiked = currentLikes.contains(caller);
    if (isLiked) {
      currentLikes.remove(caller);
    } else {
      currentLikes.add(caller);
    };
    songLikes.add(songId, currentLikes);
    not isLiked;
  };

  public query ({ caller }) func hasUserLikedSong(songId : SongId) : async Bool {
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
    songLikes.toArray().filter(
      func((songId, likesSet)) { likesSet.contains(caller); }
    ).map(
      func((songId, _)) { songId; }
    );
  };

  // USER PROFILE MANAGEMENT
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func updateProfile(displayName : Text, bio : ?Text, coverBlobId : ?Storage.ExternalBlob, socialLinks : ?Text) : async () {
    userProfiles.add(caller, { displayName; bio; coverBlobId; socialLinks });
  };

  public query ({ caller }) func getAllUserProfiles() : async [ArtistEntry] {
    userProfiles.toArray().map(func((p, profile)) { { principal = p; profile } });
  };

  // PLATFORM USER MANAGEMENT (email/password based auth)

  // Register with password stored separately (avoids stable type migration)
  public shared func registerPlatformUserWithPassword(emailHash : Text, passwordHash : Text, role : Text, displayName : Text) : async { #ok; #emailTaken } {
    if (platformUsers.containsKey(emailHash)) {
      return #emailTaken;
    };
    platformUsers.add(emailHash, {
      emailHash;
      role;
      displayName;
      banned = false;
      registeredAt = Time.now();
    });
    platformPasswords.add(emailHash, passwordHash);
    #ok;
  };

  // Login: verify credentials and return user data
  public query func loginPlatformUser(emailHash : Text, passwordHash : Text) : async LoginResult {
    switch (platformUsers.get(emailHash)) {
      case (null) { #err("Email ou senha incorretos.") };
      case (?user) {
        let storedPw = switch (platformPasswords.get(emailHash)) {
          case (null) { "" };
          case (?pw) { pw };
        };
        if (storedPw != passwordHash) {
          #err("Email ou senha incorretos.");
        } else if (user.banned) {
          #err("A tua conta foi suspensa. Contacta o suporte.");
        } else {
          #ok({ role = user.role; displayName = user.displayName });
        };
      };
    };
  };

  // Legacy register (no password) — kept for backwards compat
  public shared func registerPlatformUser(emailHash : Text, role : Text, displayName : Text) : async () {
    if (not platformUsers.containsKey(emailHash)) {
      platformUsers.add(emailHash, {
        emailHash;
        role;
        displayName;
        banned = false;
        registeredAt = Time.now();
      });
    };
  };

  public query func getAllPlatformUsers() : async [PlatformUserRecord] {
    platformUsers.values().toArray();
  };

  public shared func banPlatformUser(emailHash : Text, banned : Bool) : async () {
    switch (platformUsers.get(emailHash)) {
      case (null) {};
      case (?user) {
        platformUsers.add(emailHash, { user with banned });
      };
    };
  };

  public shared func deletePlatformUser(emailHash : Text) : async () {
    platformUsers.remove(emailHash);
    platformPasswords.remove(emailHash);
  };

  public query func isPlatformUserBanned(emailHash : Text) : async Bool {
    switch (platformUsers.get(emailHash)) {
      case (null) { false };
      case (?user) { user.banned };
    };
  };

  // ADMIN: Delete any song
  public shared ({ caller }) func adminDeleteSong(songId : SongId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can use this function");
    };
    songs.remove(songId);
    songExtras.remove(songId);
    songLikes.remove(songId);
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

  // SEARCH
  public query ({ caller }) func searchSongs(searchTerm : Text) : async [SongMetadata] {
    songs.values().toArray().filter(
      func(songEntry) {
        songEntry.title.contains(#text searchTerm) or songEntry.artist.contains(#text searchTerm);
      }
    ).map(func(songEntry) {
      buildMetadata(songEntry, getLikeCount(songEntry.songId));
    });
  };

  // DELETE SONG (by owner)
  public shared ({ caller }) func deleteSong(songId : SongId) : async () {
    switch (songs.get(songId)) {
      case (null) { Runtime.trap("Song not found"); };
      case (?songEntry) {
        if (songEntry.uploader != caller and not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
          Runtime.trap("Unauthorized: Must be the owner or admin to delete the song");
        };
      };
    };
    songs.remove(songId);
    songExtras.remove(songId);
    songLikes.remove(songId);
  };

  // ========== SUBSCRIPTION MODULE ==========

  func planAmount(plan : SubscriptionPlan) : Nat {
    switch (plan) {
      case (#free) { 0 };
      case (#basic) { 500 };
      case (#premium) { 1000 };
    };
  };

  func addRevenue(amount : Nat, month : Text) {
    let existing = switch (revenues.get(month)) {
      case (null) { { month; totalRevenue = 0; artistShare = 0; platformShare = 0 } };
      case (?r) { r };
    };
    let newTotal = existing.totalRevenue + amount;
    revenues.add(month, {
      month;
      totalRevenue = newTotal;
      artistShare = newTotal * 60 / 100;
      platformShare = newTotal * 40 / 100;
    });
  };

  public query func getUserSubscription(emailHash : Text) : async ?SubscriptionRecord {
    subscriptions.get(emailHash);
  };

  public query func getAllSubscriptions() : async [SubscriptionRecord] {
    subscriptions.values().toArray();
  };

  public shared func createOrUpdateSubscription(emailHash : Text, plan : SubscriptionPlan, paymentMethod : Text, month : Text) : async Text {
    let now = Time.now();
    let paymentId = emailHash # "-" # month # "-" # (debug_show (now % 1_000_000));
    let amount = planAmount(plan);
    let pr : PaymentRecord = {
      paymentId;
      emailHash;
      plan;
      amount;
      paymentMethod;
      status = #pending;
      timestamp = now;
      transactionRef = "";
    };
    payments.add(paymentId, pr);
    paymentId;
  };

  public shared func confirmPayment(paymentId : Text, transactionRef : Text, month : Text) : async Bool {
    switch (payments.get(paymentId)) {
      case (null) { false };
      case (?pr) {
        payments.add(paymentId, { pr with status = #confirmed; transactionRef });
        let now = Time.now();
        let thirtyDays : Time.Time = 30 * 24 * 60 * 60 * 1_000_000_000;
        subscriptions.add(pr.emailHash, {
          emailHash = pr.emailHash;
          plan = pr.plan;
          startDate = now;
          expirationDate = now + thirtyDays;
          autoRenew = true;
        });
        if (pr.amount > 0) {
          addRevenue(pr.amount, month);
        };
        true;
      };
    };
  };

  public shared func cancelSubscription(emailHash : Text) : async () {
    switch (subscriptions.get(emailHash)) {
      case (null) {};
      case (?sub) {
        subscriptions.add(emailHash, { sub with autoRenew = false });
      };
    };
  };

  public query func getPaymentHistory(emailHash : Text) : async [PaymentRecord] {
    payments.values().toArray().filter(func(pr) { pr.emailHash == emailHash });
  };

  public query func getAllPayments() : async [PaymentRecord] {
    payments.values().toArray();
  };

  public query func getRevenueStats() : async [RevenueRecord] {
    revenues.values().toArray();
  };

  public shared func checkAndDowngradeExpired(currentTime : Time.Time) : async Nat {
    var count = 0;
    for ((emailHash, sub) in subscriptions.entries()) {
      if (sub.plan != #free and sub.expirationDate > 0 and sub.expirationDate < currentTime) {
        subscriptions.add(emailHash, {
          emailHash;
          plan = #free;
          startDate = currentTime;
          expirationDate = 0;
          autoRenew = false;
        });
        count += 1;
      };
    };
    count;
  };
};
