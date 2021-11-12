//const fs = require("fs");

/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author
 * PUT_YOUR_NAME_HERE
 */
const htmlToElement = function (html) {
  /** function body */
  var template = document.createElement("template");
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild;
};

/** namespace. */
var rhit = rhit || {};
// import "./axios"
// import {Buffer} from "buffer";
// var buffer = require("buffer");

rhit.entryController = undefined;
rhit.profileController = undefined;
rhit.collectionController = undefined;
rhit.artistController = undefined;
rhit.albumController = undefined;
rhit.addEntryController = undefined;
rhit.editEntryController = undefined;
rhit.authManager = undefined;
rhit.auctionController = undefined;
rhit.browseController = undefined;

rhit.COLLECTION_ALBUM_NAME = "Albums";
rhit.COLLECTION_ARTIST_NAME = "Artists";
rhit.COLLECTION_USER_NAME = "Users";

class Album {
  constructor(name, artists) {
    this.name = name;
    this.artists = artists;
  }
}

rhit.AuthManager = class {
  constructor() {
    this._user = null;
    // this.userFb = null;
    this.userRef = firebase.firestore().collection(rhit.COLLECTION_USER_NAME);
    // Initialize the FirebaseUI Widget using Firebase.
    this.beginListening(() => {});
  }

  beginListening(changeListener) {
    // console.log(firebase.auth)
    firebase.auth().onAuthStateChanged((user) => {
      this._user = user;
      console.log(this._user);
      changeListener();
    });
  }
};

rhit.LoginController = class {
  constructor() {
    var ui = new firebaseui.auth.AuthUI(firebase.auth());

    ui.start("#firebaseui-auth-container", {
      signInSuccessUrl: "/index.html",
      signInOptions: [
        // List of OAuth providers supported.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        // firebase.auth.GithubAuthProvider.PROVIDER_ID,
      ],
      // Other config options...
    });
  }
};
/** globals */
rhit.EntryController = class {
  constructor() {
    //document.querySelector("")
    this._documentSnapshots = [];
    this._documentSnapshot = {};
    this._album_ref = firebase
      .firestore()
      .collection(rhit.COLLECTION_ALBUM_NAME);
    this._unsubscribe = null;
    this._artist_ref = firebase
      .firestore()
      .collection(rhit.COLLECTION_ARTIST_NAME);

    this._single_artist_ref = undefined;
    this._single_album_ref = undefined;

    this._docData = undefined;

    this.userRef = firebase.firestore().collection(rhit.COLLECTION_USER_NAME);
    this.userDoc = undefined;
    this.userRefForUpdate = undefined;

    document.querySelector("#formID").parentElement.style.display = "none";

    document.querySelector("#entrySpotifyImportBtn").onclick = (event) => {
      event.preventDefault();
      if (document.querySelector("#entryAlbumSelect > input").checked)
        this.importSpotifyAlbum();
      else this.importSpotifyArtist();
    };

    document.querySelector("#entryArtistSelect").onclick = (event) => {
      document.querySelector("#formTags").parentElement.style.display = "none";
      document.querySelector("#formAlbumName").parentElement.style.display =
        "none";
      document.querySelector("#formDuration").parentElement.style.display =
        "none";
      document.querySelector("#formRelease").parentElement.style.display =
        "none";
      document.querySelector("#formID").parentElement.style.display = "block";
    };

    document.querySelector("#entryAlbumSelect").onclick = (event) => {
      document.querySelector("#formTags").parentElement.style.display = "block";
      document.querySelector("#formAlbumName").parentElement.style.display =
        "block";
      document.querySelector("#formDuration").parentElement.style.display =
        "block";
      document.querySelector("#formRelease").parentElement.style.display =
        "block";
      document.querySelector("#formID").parentElement.style.display = "none";
    };

    // document.querySelector("#entrySubmitBtn").onclick = (event) => {
    //   event.preventDefault();
    //   this.add();
    // };

    const loc = new URLSearchParams(window.location.search);
    const artistId = loc.get("artistId");
    const albumId = loc.get("albumId");
    if (loc.get("err")) {
      document.querySelector("#entryArtistSelect").onclick();
      alert(`Artist does not exist.\nPlease enter their information.`);
    }

    if (artistId || albumId) {
      if (artistId) {
        this._single_artist_ref = this._artist_ref.doc(artistId);
        // document.querySelector("#artistEditBtn").href = `./entry.html?artistId=${artistId}`
        let select = document.querySelector("#entryArtistSelect");
        document.querySelector("#entryAlbumSelect").style.display = "none";
        document.querySelector("#formArtistName").disabled = true;
        document.querySelector("#entryArtistSelect > input").checked = true;
        select.onclick();
        // document.querySelector("#entryArtistSelect").onclick()
      }
      if (albumId) {
        this._single_album_ref = this._album_ref.doc(albumId);

        document.querySelector("#entryArtistSelect").style.display = "none";
        document.querySelector("#entryAlbumSelect").onclick();
        document.querySelector("#entrySubmitBtn").onclick = (event) => {
          event.preventDefault();
          this.update();
        };

        document.querySelector("#entryDeleteBtn").onclick = (event) => {
          event.preventDefault();
          this.delete();
        };
      }

      document.querySelector("#entrySubmitBtn").onclick = (event) => {
        event.preventDefault();
        this.update();
      };
    } else {
      document.querySelector("#entryDeleteBtn").style.display = "none";
      document.querySelector("#entrySubmitBtn").onclick = (event) => {
        event.preventDefault();
        this.add();
      };
    }

    if (this._single_artist_ref || this._single_album_ref)
      this.beginListening(this.updateView.bind(this));
  }

  updateDisplayFromSpotifyArtist(spotifyArtist) {
    // document.querySelector("#formDescription").value =
    //   this._documentSnapshot.get("description");
    document.querySelector("#formArtistName").value = spotifyArtist.name;
    // document.querySelector("#formTags").value =
    //   this._documentSnapshot.get("tags");
    // document.querySelector("#formDuration").value =
    //   this._documentSnapshot.get("duration");
  }

  updateDisplayFromSpotifyAlbum(spotifyAlbum) {
    // document.querySelector("#formDescription").value =
    //   this._documentSnapshot.get("description");
    document.querySelector("#formImg").value = spotifyAlbum.images[0].url;
    document.querySelector("#formAlbumName").value = spotifyAlbum.name;

    let tracks = spotifyAlbum.tracks.items;
    let duration = 0;

    for (let track of tracks) {
      duration += track.duration_ms;
    }

    console.log(duration);
    duration /= 60000;
    duration = Math.round(duration);
    document.querySelector("#formDuration").value = duration;
    console.log(tracks);
    document.querySelector("#formArtistName").value =
      spotifyAlbum.artists[0].name;

    let date = new Date(spotifyAlbum.release_date);
    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);

    var today = date.getFullYear() + "-" + month + "-" + day;
    document.querySelector("#formRelease").value = today;
    // document.querySelector("#formTags").value =
    //   this._documentSnapshot.get("tags");
    // document.querySelector("#formDuration").value =
    //   this._documentSnapshot.get("duration");
  }

  importSpotifyArtist() {
    let artistLink = document.querySelector("#formSpotify").value;
    let idStart, idEnd;
    idStart = artistLink.indexOf("artist/") + "artist/".length;
    idEnd = artistLink.indexOf("?si");

    let id = artistLink.substr(idStart, idEnd - idStart);
    console.log("artist id: ", id);
    fetch(`https://us-central1-paynesc-jmdb.cloudfunctions.net/api/api/artistInfo/${id}`, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    })
      .then((resp) => resp.json())
      .then((data) => {
        let artistObj = data.artist;
        console.log(data);
        document.querySelector("#formImg").value = artistObj.images[0].url;
        if (!this._single_artist_ref)
          document.querySelector("#formArtistName").value = artistObj.name;
        document.querySelector("#formID").value = id;
        // document.querySelector("#")
      });
  }

  importSpotifyAlbum() {
    let albumLink = document.querySelector("#formSpotify").value;
    let idStart, idEnd;
    idStart = albumLink.indexOf("album/") + "album/".length;
    idEnd = albumLink.indexOf("?si");

    let id = albumLink.substr(idStart, idEnd - idStart);
    console.log("album id: ", id);
    fetch(`https://us-central1-paynesc-jmdb.cloudfunctions.net/api/api/albumInfo/${id}`, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    })
      .then((resp) => resp.json())
      .then((data) => {
        console.log(data);
        this.updateDisplayFromSpotifyAlbum(data);
        // if(!this._single_artist_ref) document.querySelector("#formArtistName").value = data.name;
        // document.querySelector("#")
      });
  }

  beginListening(changeListener) {
    const ref = this._single_artist_ref || this._single_album_ref;
    if (ref) {
      this._unsubscribe = ref.onSnapshot((doc) => {
        if (doc.exists) {
          console.log("Document data:", doc.data());
          this._documentSnapshot = doc;
          this._docData = doc.data();
          changeListener();
        } else {
          // doc.data() will be undefined in this case
          console.log("No such document!");
          //window.location.href = "/";
        }
      });
    }

    let userQuery = this.userRef.where("uid", "==", rhit.authManager._user.uid);

    userQuery.onSnapshot((snapshot) => {
      this.userDoc = snapshot.docs[0];
      this.userRefForUpdate = firebase
        .firestore()
        .collection(rhit.COLLECTION_USER_NAME)
        .doc(this.userDoc.id);
    });
    // let quote = this.quote;
  }

  updateView() {
    if (document.querySelector("#entryAlbumSelect > input").checked) {
      document.querySelector("#formAlbumName").value =
        this._documentSnapshot.get("albumName");
      document.querySelector("#formDescription").value =
        this._documentSnapshot.get("description");
      document.querySelector("#formArtistName").value =
        this._documentSnapshot.get("artist");
      document.querySelector("#formTags").value =
        this._documentSnapshot.get("tags");
      document.querySelector("#formDuration").value =
        this._documentSnapshot.get("duration");

      let date = new Date(
        this._documentSnapshot.get("releaseDate").seconds * 1000
      );

      var day = ("0" + date.getDate()).slice(-2);
      var month = ("0" + (date.getMonth() + 1)).slice(-2);

      var today = date.getFullYear() + "-" + month + "-" + day;
      document.querySelector("#formRelease").value = today;
    } else {
      document.querySelector("#formDescription").value =
        this._documentSnapshot.get("description");

      document.querySelector("#formArtistName").value =
        this._documentSnapshot.get("artistName");
      document.querySelector("#formID").value =
        this._documentSnapshot.get("spotifyID");
    }
    document.querySelector("#formImg").value =
      this._documentSnapshot.get("imageUrl");
  }

  update() {
    const albumName = document.querySelector("#formAlbumName").value;
    const description = document.querySelector("#formDescription").value;
    const artistName = document.querySelector("#formArtistName").value;
    const tags = document.querySelector("#formTags").value;
    const duration = document.querySelector("#formDuration").value;
    let releaseDate = document.querySelector("#formRelease").value;
    const imageURL = document.querySelector("#formImg").value;
    const spotifyID = document.querySelector("#formID").value;
    console.log(description);
    console.log(artistName);

    if (
      document.querySelector("#entryArtistSelect").firstElementChild.checked
    ) {
      this._single_artist_ref
        .update({
          name: artistName,
          description: description,
          imageUrl: imageURL,
          spotifyID: spotifyID,
        })
        .then((doc) => {
          window.location.href = `./artist.html?artistId=${this._single_artist_ref.id}`;
        });
    } else if (
      document.querySelector("#entryAlbumSelect").firstElementChild.checked
    ) {
      releaseDate = new Date(releaseDate);
      releaseDate.setDate(releaseDate.getDate() + 1);
      this._single_album_ref
        .update({
          albumName: albumName,
          artist: artistName,
          description: description,
          tags: tags.split(","),
          duration: parseInt(duration),
          releaseDate: firebase.firestore.Timestamp.fromDate(releaseDate),
          imageUrl: imageURL,
        })
        .then((doc) => {
          const loc = new URLSearchParams(window.location.search);
          const albumId = loc.get("albumId");
          window.location.href = `./album.html?albumId=${albumId}`;
        });
    } else {
      console.log("WHAT IN THE HELL IS HAPPENING????");
      console.error("Holy moly doofus");
    }
  }

  delete() {
    const loc = new URLSearchParams(window.location.search);
    const artistId = loc.get("artistId");
    const albumId = loc.get("albumId");

    if (
      document.querySelector("#entryArtistSelect").firstElementChild.checked
    ) {
      this._single_artist_ref.delete().then((param) => {
        window.location.href = "browse.html";
      });
    } else {
      this._single_album_ref.delete().then((param) => {
        window.location.href = "browse.html";

        let myAlbums = this.userDoc.get("albumCollection");
        let wishlist = this.userDoc.get("wishlist");

        let index = myAlbums.findIndex((e) => e.id == albumId);
        if (index > -1) myAlbums.splice(index, 1);
        index = wishlist.findIndex((e) => e.id == albumId);
        if (index > -1) wishlist.splice(index, 1);

        this.userRefForUpdate.update({
          albumCollection: myAlbums,
          wishlist: wishlist,
        });
      });
    }
  }

  add() {
    const albumName = document.querySelector("#formAlbumName").value;
    const description = document.querySelector("#formDescription").value;
    const artistName = document.querySelector("#formArtistName").value;
    const tags = document.querySelector("#formTags").value;
    const duration = document.querySelector("#formDuration").value;
    let releaseDate = document.querySelector("#formRelease").value;
    const imageURL = document.querySelector("#formImg").value;
    const spotifyID = document.querySelector("#formID").value;

    console.log(description);
    console.log(artistName);

    if (
      document.querySelector("#entryArtistSelect").firstElementChild.checked
    ) {
      this._artist_ref
        .doc(artistName)
        .set({
          artistName: artistName,
          description: description,
          imageUrl: imageURL,
          spotifyID: spotifyID,
        })
        .then((docRef) => {
          window.location.href = `/artist.html?artistId=${artistName}`;
        });
    } else if (
      document.querySelector("#entryAlbumSelect").firstElementChild.checked
    ) {
      releaseDate = new Date(releaseDate);
      releaseDate.setDate(releaseDate.getDate() + 1);
      this._album_ref
        .add({
          albumName: albumName,
          artist: artistName,
          description: description,
          tags: tags
            .split(",")
            .concat([albumName.toLowerCase(), artistName.toLowerCase()]),
          duration: parseInt(duration),
          releaseDate: firebase.firestore.Timestamp.fromDate(releaseDate),
          imageUrl: imageURL,
        })
        .then((docRef) => {
          window.location.href = `/album.html?albumId=${docRef.id}`;
        });
    } else {
      console.log("WHAT IN THE HELL IS HAPPENING????");
      console.error("Holy moly doofus");
    }
    // if(document.querySelector("#entryArtistSelect"))
  }
};

rhit.AlbumController = class {
  constructor(albumId) {
    this._documentSnapshot = null;
    this.owned = false;
    this.ref = firebase
      .firestore()
      .collection(rhit.COLLECTION_ALBUM_NAME)
      .doc(albumId);

    this.userRef = firebase.firestore().collection(rhit.COLLECTION_USER_NAME);
    this.user = undefined;
    this.userRefForUpdate = undefined;
    let query = this.userRef.where("uid", "==", rhit.authManager._user.uid);
    let myAlbums = document.querySelector("#profileCollectionFlex");

    // Update Collection
    query.onSnapshot((snapshot) => {
      this.user = snapshot.docs[0];
      this.userRefForUpdate = firebase
        .firestore()
        .collection(rhit.COLLECTION_USER_NAME)
        .doc(this.user.id);
      let albumCollection = this.user.get("albumCollection");
      let wishlist = this.user.get("wishlist");

      let collectionBtn = document.querySelector("#albumColLeft > button");
      if (albumCollection.some((a) => a.id == albumId)) {
        collectionBtn.style.backgroundColor = "red";
        collectionBtn.innerHTML = "-";
      } else {
        collectionBtn.style.backgroundColor = "rgb(0, 153, 219)";
        collectionBtn.innerHTML = "+";
      }

      let wishlistBtn = document.querySelector("#albumColRight > button");
      if (wishlist.some((a) => a.id == albumId)) {
        wishlistBtn.style.backgroundColor = "red";
        wishlistBtn.innerHTML = "-";
      } else {
        wishlistBtn.style.backgroundColor = "rgb(0, 153, 219)";
        wishlistBtn.innerHTML = "+";
      }
    });

    document.querySelector("#albumColRight > button").onclick = (event) => {
      let btn = event.target;
      if (btn.innerHTML == "-") {
        btn.style.backgroundColor = "#0099db";
        btn.style.color = "white";
        btn.innerHTML = "+";
      } else {
        btn.style.backgroundColor = "red";
        btn.style.color = "white";
        btn.innerHTML = "-";
      }

      //TODO: Add to wishlist logic
    };

    document.querySelector("#albumColLeft > button").onclick = () => {
      console.log("wishlist hi");
      let btn = event.target;
      if (btn.innerHTML == "-") {
        btn.style.backgroundColor = "#0099db";
        btn.style.color = "white";
        btn.innerHTML = "+";
      } else {
        btn.style.backgroundColor = "red";
        btn.style.color = "white";
        btn.innerHTML = "-";
      }
      //TODO: Add to collection logic
      console.log("username: ", this.userRef.get("username"));
    };
    this.beginListening();
  }

  beginListening(changeListener) {
    this.ref.onSnapshot((doc) => {
      console.log(doc.data());

      let albumTitle = doc.get("albumName");
      let artist = doc.get("artist");
      let date = new Date(doc.get("releaseDate").seconds * 1000);
      console.log(date);
      let releaseDate = `${
        date.getMonth() + 1
      }/${date.getDate()}/${date.getFullYear()}`;
      console.log(releaseDate);
      let description = doc.get("description");
      let imageUrl = doc.get("imageUrl");

      document.querySelector("#albumPic").src = doc.get("imageUrl");
      document.querySelector("#albumTitle").innerHTML =
        albumTitle.toUpperCase();
      document.querySelector("#albumArtist").innerHTML = artist.toUpperCase();
      document.querySelector("#albumReleaseDateContent").innerHTML =
        releaseDate;
      document.querySelector("#albumDetailDescription").textContent =
        description;
      document.querySelector("#albumShop").onclick = (event) => {
        window.location.href = `/auction.html?albumTitle=${albumTitle}&albumArtist=${artist}`;
      };

      document.querySelector("#albumShop").onclick = () => {
        window.location.href = `/auction.html?search=${
          albumTitle + " " + artist
        }`;
      };

      document.querySelector(
        "#albumEditBtn"
      ).href = `./entry.html?albumId=${doc.id}`;

      let albumCollection = this.user.get("albumCollection");
      let wishlist = this.user.get("wishlist");
      //Add/Remove from My Albums
      document.querySelector("#albumColLeft > button").onclick = (event) => {
        let owned = event.target.innerText == "-";

        if (owned) {
          let idx = albumCollection.findIndex((e) => e.id == doc.id);
          albumCollection.splice(idx, 1);
        } else {
          albumCollection.push({
            album: albumTitle,
            artist: artist,
            id: doc.id,
            imageUrl: imageUrl,
          });
          // }
        }
        this.userRefForUpdate
          .update({
            albumCollection: albumCollection,
          })
          .then((docId) => {
            console.log("Successfully Added to My Albums");
          });
      };

      document.querySelector("#albumColRight > button").onclick = (event) => {
        let owned = event.target.innerText == "-";

        if (owned) {
          let idx = wishlist.findIndex((e) => e.id == doc.id);
          wishlist.splice(idx, 1);
        } else {
          wishlist.push({
            album: albumTitle,
            artist: artist,
            id: doc.id,
            imageUrl: imageUrl,
          });
          // }
        }
        this.userRefForUpdate
          .update({
            wishlist: wishlist,
          })
          .then((docId) => {
            console.log("Successfully Added to My Albums");
          });
      };
    });
  }
};

rhit.ArtistController = class {
  constructor(artistId) {
    this._documentSnapshot = null;
    this.artistID = artistId;
    this.ref = firebase
      .firestore()
      .collection(rhit.COLLECTION_ARTIST_NAME)
      .doc(artistId);

    this.beginListening();
  }

  beginListening(changeListener) {
    this.ref.onSnapshot((doc) => {
      console.log(doc.data());

      // let albumTitle = doc.get('albumName');
      let artist = doc.get("artistName");

      if (!artist) {
        window.location.href = `entry.html?err=missingArtist`;
      }
      // let date = new Date(doc.get('releaseDate').seconds * 1000)
      // let releaseDate = `${date.getMonth()}/${date.getDate()}/${date.getFullYear()}`
      let description = doc.get("description");
      let spotifyID = doc.get("spotifyID");

      if (spotifyID) {
        fetch(
          `https://us-central1-paynesc-jmdb.cloudfunctions.net/api/api/artistInfo/${spotifyID}`
        )
          .then((resp) => resp.json())
          .then((dataResp) => {
            const track = dataResp.previewTrack;

            let card = htmlToElement(
              `
            <div id="artistAudioPlayerCard" height="100" class="card mt-5">
              <div class="card-body">
              <div class="row">
              <div class="col" id="audioPlayerImgContainer">
                <img class="card-img-left"  width="100" src="${
                  track.imageUrl
                }" alt="Card image cap">
              </div>
              <div class="col" id="audioPlayerTrackInfo">
                <h5 class="card-title">${track.name}</h5>
                <p class="card-text">${track.artists.toString()}</p>
                <audio controls>
                  <source src="${track.previewUrl}">
                </audio>
              </div>
            </div>
              </div>
            </div>
            `
            );

            document.querySelector("#artistMain").appendChild(card);
          });
      }

      document.querySelector("#albumTitle").innerHTML = artist.toUpperCase();
      // document.querySelector("#albumArtist").innerHTML = artist.toUpperCase();
      // document.querySelector("#albumReleaseDateContent").innerHTML = releaseDate;
      document.querySelector("#albumPic").src = doc.get("imageUrl");
      // document.querySelector("#albumDetailDescription").textContent =
      //   description;
      document.querySelector("#artistShopBtn").onclick = (event) => {
        window.location.href = `/auction.html?search=${artist}%20artist`;
      };

      document.querySelector(
        "#artistEditBtn"
      ).href = `./entry.html?artistId=${doc.id}`;
    });
  }
};

rhit.ProfileController = class {
  constructor() {
    //document.querySelector();
    console.log("Profile Controller created");

    // document.querySelector("#profileUsername").textContent =
    //   rhit.authManager._user.displayName.toUpperCase();

    this._ref = firebase.firestore().collection(rhit.COLLECTION_USER_NAME);
    this._documentSnapshot = null;
    this.userRef = undefined;
    this.beginListening();

    window.onresize = () => {
      console.log("Width: ", window.innerWidth);
      if (window.innerWidth >= 768) {
      }
    };
  }

  beginListening(changeListener) {
    let query = this._ref.where("uid", "==", rhit.authManager._user.uid);
    let myAlbums = document.querySelector("#profileCollectionFlex");
    let myWishlist = document.querySelector("#profileWishlistFlex");
    query.onSnapshot((snapshot) => {
      if (!snapshot.docs.length || !snapshot.docs) {
        let newUser = {
          albumCollection: [],
          favoriteSong: "",
          joinDate: firebase.firestore.Timestamp.now(),
          uid: rhit.authManager._user.uid,
          username: `user${Math.round(Math.random() * 100000)}`,
          wishlist: [],
        };

        this._ref.add(newUser).then((doc) => {
          window.location.href = "./index.html";
        });
      } else {
        this._documentSnapshot = snapshot.docs[0];
        this.userRef = firebase
          .firestore()
          .collection(rhit.COLLECTION_USER_NAME)
          .doc(this._documentSnapshot.id);
        let collection = this._documentSnapshot.get("albumCollection");
        let wishlist = this._documentSnapshot.get("wishlist");
        let username = this._documentSnapshot.get("username");
        let joinDate = new Date(
          this._documentSnapshot.get("joinDate").seconds * 1000
        );


        


        console.log(joinDate);
        document.querySelector("#profileUsername").innerHTML = username;
        document.querySelector("#profileJoinDate").innerHTML = `JOINED: ${
          joinDate.getMonth() + 1
        }/${joinDate.getDate()}/${joinDate.getFullYear()}`;

        document.querySelector("#profileChangeSong").onclick = () => {
          document.querySelector("#inputUsername").value = username;
          document.querySelector("#inputImageUrl").value =
            this._documentSnapshot.get("profileImageURL");
          // document.querySelector("inputImageUrl").value =
        };

        document.querySelector("#profileInfo > img").src =
          this._documentSnapshot.get("profileImageURL");

        document.querySelector("#submitEdit").onclick = () => {
          this.userRef.update({
            username: document.querySelector("#inputUsername").value,
            profileImageURL: document.querySelector("#inputImageUrl").value,
          });
        };

        console.log(collection);

        myAlbums.innerHTML = "";
        myWishlist.innerHTML = "";
        collection.forEach((album, index) => {
          // console.log(doc.data())
          // console.log(album);
          if (index > 3) return;
          let albumCirc = htmlToElement(
            `
          <div class="profileAlbum">
            <a href="./album.html?albumId=${album.id}"><img class="profileAlbumPic" src="${album.imageUrl}" alt=""></a>
            <div class="profileAlbumInfo">
              <p class="profileAlbumTitle">${album.album}</p>
              <p class="profileAlbumArtist"><a href="artist.html?artistId=${album.artist}">${album.artist}</a></p>
            </div>
          </div>
          `
          );

          myAlbums.appendChild(albumCirc);
        });

        wishlist.forEach((album, index) => {
          if (index > 3) return;
          let albumCirc = htmlToElement(
            `
          <div class="profileAlbum">
            <a href="./album.html?albumId=${album.id}"><img class="profileAlbumPic" src="${album.imageUrl}" alt=""></a>
            <div class="profileAlbumInfo">
              <p class="profileAlbumTitle">${album.album}</p>
              <p class="profileAlbumArtist"><a href="artist.html?artistId=${album.artist}">${album.artist}</a></p>
            </div>
          </div>
          `
          );

          myWishlist.appendChild(albumCirc);
        });

        if (wishlist.length > 0) {
          let alb = wishlist[0];
          let searchQuery = `${alb.album} ${alb.artist}`;
          this.fetchRakutenAPI(searchQuery).then((items) => {
            this.RakutenToDOM(items);
          });
        }

        if(this._documentSnapshot.get("profileImageURL") == "")
        document.querySelector("#profilePic").style.display = "none";

        if(wishlist.length == 0 && collection.length == 0){
          document.querySelector("#profileAuctionSearch").style.display = "none"
          document.querySelector("#profileAlbumCollection").style.display = "none"
          document.querySelector("#profileWishlist").style.display = "none"
          document.querySelector("#profileMain").appendChild(htmlToElement(`<div id="profileAddAlbums">Go to the Browse page to add albums to your collection!</div>`));
        }
      }
    });
  }

  async fetchRakutenAPI(searchQuery) {
    const hostName =
      "https://rakuten_webservice-rakuten-marketplace-item-search-v1.p.rapidapi.com";
    let sQuery = searchQuery.replace(" ", "%20");

    const path = `/IchibaItem/Search/20170706?keyword=${sQuery}&field=1&sort=standard`;

    const url = hostName + path;
    console.log("Searching ", url);
    var options = {
      method: "GET",
      headers: {
        "x-rapidapi-host":
          "rakuten_webservice-rakuten-marketplace-item-search-v1.p.rapidapi.com",
        "x-rapidapi-key": "62a9f2057fmshaa5b095b786f582p14de6bjsnb74454fe2c4f",
        "Access-Control-Allow-Origin": "*",
      },
      crossdomain: true,
    };

    return fetch(url, options)
      .then((response) => response.json())
      .then((data) => data.Items);
  }

  RakutenToDOM(itemsList) {
    let resultsContainer = document.querySelector("#auctionResultsContainer");
    resultsContainer.innerHTML = "";
    console.log("itemsList", itemsList);
    if (!itemsList.length) {
      let card = htmlToElement(
        `
        <div id="auctionNoResults">No Results</div>
        `
      );

      resultsContainer.appendChild(card);
    }
    for (let i = 0; i < 5 && i < itemsList.length; i++) {
      const item = itemsList[i].Item;
      const firstImg = item.mediumImageUrls[0].imageUrl;
      console.log(firstImg);
      let card = htmlToElement(
        `
          <div class="row auctionCard"style="width: 99%;margin: auto;box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);">
            <img class="card-img-left auctionCardImage col" src="${firstImg}" alt="Card image cap" width="100" height="100"/>
            <div class="col text-left">
              <div style="height:4em; line-height: 1.5em; overflow: hidden;">
                <p class="card-text auctionCardItemName mb-0 pt-3">${item.itemName}</p>
              </div>
              <small class="card-text">Price: ${item.itemPrice}</small>
              <div class="text-right">
                <a href="${item.itemUrl}" target="_blank">OPEN ➜</a>
              </div>
            </div> 
          </div>
            `
      );

      resultsContainer.appendChild(card);
      console.log(itemsList[i].Item.itemName);
    }
  }
};

rhit.BrowseController = class {
  constructor() {
    this._documentSnapshots = [];
    this._ref = firebase.firestore().collection(rhit.COLLECTION_ALBUM_NAME);
    this._unsubscribe = null;

    let urlQuery = new URLSearchParams(window.location.search);
    document.querySelector("#browseAlbumTitle").value = urlQuery.get("title");
    document.querySelector("#browseAlbumArtist").value = urlQuery.get("artist");
    document.querySelector("#browseAlbumDate").value = urlQuery.get("year");


    document.querySelector("#collectionFilterBtn").onclick = (e) => {
      e.preventDefault();
      let title = document.querySelector("#browseAlbumTitle").value;
      let artist = document.querySelector("#browseAlbumArtist").value;
      let year = document.querySelector("#browseAlbumDate").value;
      year = parseInt(year);

      console.log("title: ", title);
      console.log("artist: ", artist);
      console.log("date: ", year);

      window.location.href = `./browse.html?${title ? "title=" + title : ""}${
        title ? "&" : ""
      }${artist ? "artist=" + artist : ""}${
        (title || artist) && year ? "&" : ""
      }${year ? "year=" + year : ""}`;
    };

    this.beginListening(() => {});
  }

  // updateTable(albums) {

  //   albums.forEach((album) => {

  //   });
  // }

  beginListening(callbackFunc) {
    let urlQuery = new URLSearchParams(window.location.search);

    let params = [
      urlQuery.get("title"),
      urlQuery.get("artist"),
      urlQuery.get("year"),
    ];
    let availParams = params.map((ob) => !!ob);

    let tagsToSearch = [];
    let query = this._ref;
    if (availParams.some((e) => e)) {
      for (let i = 0; i < params.length; i++) {
        if (availParams[i]) {
          if (i != 2) tagsToSearch.push(params[i].toLowerCase());
          tagsToSearch.push(params[i]);
        }
      }

      query = this._ref.where("tags", "array-contains-any", tagsToSearch);
    }

    // query.onSnapshot((snapshot) => {
    //   console.log(snapshot.docs)
    // })

    query.onSnapshot((snapshot) => {
      this._documentSnapshots = snapshot.docs;
      // const albums = [];

      const table = document.querySelector("#browseTable > tbody");
      table.innerHTML = "";
      // <img class="card-img-left auctionCardImage col" src="${firstImg}" alt="Card image cap" width="100" height="100"/>
      this._documentSnapshots.forEach((album) => {
        let row = table.insertRow(0);

        let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        let cell3 = row.insertCell(2);
        let cell4 = row.insertCell(3);
        let cell5 = row.insertCell(4);

        cell1.innerHTML = `<img src="${album.get("imageUrl")}" alt="${album.get(
          "albumName"
        )}">`;
        cell2.innerHTML = `<a href="album.html?albumId=${
          album.id
        }"}>${album.get("albumName")}</a>`;
        cell3.innerHTML = `<a href="artist.html?artistId=${album.get(
          "artist"
        )}">${album.get("artist")}</a>`;
        console.log(album.id);
        cell4.innerHTML = new Date(
          album.get("releaseDate").seconds * 1000
        ).getFullYear();
        // let wishBtn = htmlToElement(
        //   `<button class="collectionWishListAddBtn btn bmd-btn-fab" data-album-id="${album.id}">+</button>`
        // );

        // wishBtn.onclick = (event) => {
        //   let me = event.target;
        //   console.log(me.dataset.albumId);
        // };
        // cell4.appendChild(wishBtn);

        // let myAlbumsBtn = htmlToElement(
        //   `<button class="collectionDelBtn btn bmd-btn-fab btn-warning" data-album-id="${album.id}" >-</button>`
        // );
        cell5.innerHTML = album.get("duration");
        // myAlbumsBtn.onclick = (event) => {
        //   let me = event.target;
        //   console.log(me.dataset.albumId);
        // };
        // cell5.appendChild(myAlbumsBtn);
      });

      callbackFunc();
    });


  }
};

rhit.CollectionController = class {
  constructor() {
    this._documentSnapshot;
    this._ref = firebase.firestore().collection(rhit.COLLECTION_USER_NAME);
    this.collection = [];
    this.wishlist = [];
    this.user = undefined;
    // document.querySelector("#collectionShowFilter").onclick = (event) => {
    //   // event.target.style.backgroundColor = "white";
    //   let form = document.querySelector("#collectionFilterForm");
    //   if (form.style.display == "block") {
    //     form.style.display = "none";
    //   } else form.style.display = "block";
    // };

    // document.querySelector("#collectionFilterBtn").onclick = (event) => {
    //   event.preventDefault();
    // };
    if(window.innerWidth <=450){
      let btns = document.querySelectorAll(".collectionWishListAddBtn")
        btns.forEach(btn => {
          btn.parentElement.style.display = "none";
        })
      btns = document.querySelectorAll(".collectionDelBtn")
      btns.forEach(btn => {
        btn.parentElement.style.display = "none";
      })
      btns = document.querySelectorAll(".collectionWishListDelBtn")
      btns.forEach(btn => {
        btn.parentElement.style.display = "none";
      })

      document.querySelector("#wishlistCont").style.display = "none";
      document.querySelector("#ownedCont").style.display = "none";
    }

    window.onresize = () => {
      if(window.innerWidth > 450){
        let btns = document.querySelectorAll(".collectionWishListAddBtn")
        btns.forEach(btn => {
          btn.parentElement.style.display = "";
        })
      btns = document.querySelectorAll(".collectionDelBtn")
      btns.forEach(btn => {
        btn.parentElement.style.display = "";
      })

      btns = document.querySelectorAll(".collectionWishListDelBtn")
      btns.forEach(btn => {
        btn.parentElement.style.display = "";
      })

      document.querySelector("#wishlistCont").style.display = "";
      document.querySelector("#ownedCont").style.display = "";
      }

      if(window.innerWidth <=450){
        let btns = document.querySelectorAll(".collectionWishListAddBtn")
          btns.forEach(btn => {
            btn.parentElement.style.display = "none";
          })
        btns = document.querySelectorAll(".collectionDelBtn")
        btns.forEach(btn => {
          btn.parentElement.style.display = "none";
        })

        btns = document.querySelectorAll(".collectionWishListDelBtn")
        btns.forEach(btn => {
          btn.parentElement.style.display = "none";
        })

        document.querySelector("#wishlistCont").style.display = "none";
        document.querySelector("#ownedCont").style.display = "none";
      }
    }
    const wishlistBtns = document.querySelectorAll(".collectionWishListAddBtn");
    const collectionBtns = document.querySelectorAll(".collectionDelBtn");

    for (let btn of wishlistBtns) {
      btn.onclick = () => {
        console.log("Clicked");
        if (btn.innerHTML == "-") {
          btn.style.backgroundColor = "#0099db";
          btn.style.color = "white";
          btn.innerHTML = "+";
        } else {
          btn.style.backgroundColor = "red";
          btn.style.color = "white";
          btn.innerHTML = "-";
        }
      };
    }

    for (let btn of collectionBtns) {
      const table = document.querySelector("tbody");
      btn.onclick = (event) => {
        let row = event.target.parentElement.parentElement;

        table.removeChild(row);
      };
    }

    this.beginListening();
  }

  beginListening(changeListener) {
    var query = this._ref.where("uid", "==", rhit.authManager._user.uid);

    query.onSnapshot((snapshots) => {
      this._documentSnapshot = snapshots.docs[0];
      this.user = firebase
        .firestore()
        .collection(rhit.COLLECTION_USER_NAME)
        .doc(this._documentSnapshot.id);
      console.log("User doc id: ", this.user);
      //debugger;
      this.collection = this._documentSnapshot.get("albumCollection");
      this.wishlist = this._documentSnapshot.get("wishlist");

      console.log("wishlist: ", this.wishlist);
      console.log("Collection: ", this.collection);

      let table = document.querySelector("table > tbody");
      table.innerHTML = "";

      for (let i = 0; i < this.collection.length; i++) {
        let album = this.collection[i];

        this.addToTable(album, i);
      }
    });
  }

  addToTable(album, i) {
    // debugger;
    const table = document.querySelector("table > tbody");
    let row = table.insertRow(0);
    row.dataset.index = i;

    let cell1 = row.insertCell(0);
    let cell2 = row.insertCell(1);
    let cell3 = row.insertCell(2);
    let cell4 = row.insertCell(3);
    let cell5 = row.insertCell(4);

    cell1.innerHTML = `<img src="${album.imageUrl}" alt="${album.album}">`;
    cell2.innerHTML = `<a href="album.html?albumId=${album.id}">${album.album}</a>`;
    cell3.innerHTML = album.artist;
    console.log(album.id);

    let isInWishlist = this.wishlist.some((alb) => alb.id == album.id);
    console.log(`${album.album} isInWishlist = ${isInWishlist}`);
    let wishBtn;
    if (isInWishlist) {
      let wishlistIdx = this.wishlist.findIndex((alb) => alb.id == album.id);
      wishBtn = htmlToElement(
        `<button class="collectionWishListDelBtn btn bmd-btn-fab btn-warning" data-index="${i}" data-wishlist-index="${wishlistIdx}">-</button>`
      );

      wishBtn.onclick = (event) => {
        this.removeFromWishlist(wishlistIdx);
      };
    } else {
      wishBtn = htmlToElement(
        `<button class="collectionWishListAddBtn btn bmd-btn-fab" data-index="${i}">+</button>`
      );

      wishBtn.onclick = (event) => {
        this.addWishlist(i);
      };
    }

    cell4.appendChild(wishBtn);

    let myAlbumsBtn = htmlToElement(
      `<button class="collectionDelBtn btn bmd-btn-fab btn-warning" data-index="${i}" >-</button>`
    );

    myAlbumsBtn.onclick = (event) => {
      let me = event.target;
      this.removeFromCollection(i, row);
    };
    cell5.appendChild(myAlbumsBtn);
  }

  removeFromCollection(i) {
    let removedAlbum = this.collection.splice(i, 1);

    this.user
      .update({ albumCollection: this.collection })
      .then((resp) => {
        console.log("Successfully Removed");
      })
      .catch((err) => {
        console.log(err);
      });
  }

  addWishlist(i) {
    console.log("current wishlist", this.wishlist);
    // console.log
    this.wishlist.push(this.collection[i]);
    console.log("New wishlist", this.wishlist);
    this.user
      .update({ wishlist: this.wishlist })
      .then((res) => console.log("Successfully Added to Wishlist"))
      .catch((err) => {
        console.log(err);
      });
  }

  removeFromWishlist(i) {
    let removedAlbum = this.wishlist.splice(i, 1);

    this.user
      .update({ wishlist: this.wishlist })
      .then((resp) => {
        console.log("Successfully Removed");
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

rhit.AuctionController = class {
  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get("search");
    // const albumArtist = urlParams.get("albumArtist");

    if (search) {
      document.querySelector("#auctionSearchBar").value = search;
      this.fetchRakutenAPI(search).then((itemsList) =>
        this.RakutenToDOM(itemsList)
      );
    }

    document.querySelector("#auctionSearchButton").onclick = (e) => {
      let searchQuery = document.querySelector("#auctionSearchBar").value;
      if (searchQuery)
        this.fetchRakutenAPI(searchQuery).then((itemsList) => {
          this.RakutenToDOM(itemsList);
        });
    };
  }

  async fetchRakutenAPI(searchQuery) {
    const hostName =
      "https://rakuten_webservice-rakuten-marketplace-item-search-v1.p.rapidapi.com";
    let sQuery = searchQuery.replace(" ", "%20");

    const path = `/IchibaItem/Search/20170706?keyword=${sQuery}&field=1&sort=standard`;

    const url = hostName + path;
    console.log("Searching ", url);
    var options = {
      method: "GET",
      headers: {
        "x-rapidapi-host":
          "rakuten_webservice-rakuten-marketplace-item-search-v1.p.rapidapi.com",
        "x-rapidapi-key": "62a9f2057fmshaa5b095b786f582p14de6bjsnb74454fe2c4f",
        "Access-Control-Allow-Origin": "*",
      },
      crossdomain: true,
    };

    return fetch(url, options)
      .then((response) => response.json())
      .then((data) => data.Items);
  }

  RakutenToDOM(itemsList) {
    let resultsContainer = document.querySelector("#auctionResultsContainer");
    resultsContainer.innerHTML = "";
    console.log("itemsList", itemsList);
    if (!itemsList.length) {
      let card = htmlToElement(
        `
        <div id="auctionNoResults">No Results</div>
        `
      );

      resultsContainer.appendChild(card);
    }
    for (let i = 0; i < 5 && i < itemsList.length; i++) {
      const item = itemsList[i].Item;
      const firstImg = item.mediumImageUrls[0].imageUrl;
      console.log(firstImg);
      let card = htmlToElement(
        `
          <div class="row auctionCard"style="width: 99%;margin: auto;box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);">
            <img class="card-img-left auctionCardImage col" src="${firstImg}" alt="Card image cap" width="100" height="100"/>
            <div class="col text-left">
              <div style="height:4em; line-height: 1.5em; overflow: hidden;">
                <p class="card-text auctionCardItemName mb-0 pt-3">${item.itemName}</p>
              </div>
              <small class="card-text">Price: ${item.itemPrice}</small>
              <div class="text-right">
                <a href="${item.itemUrl}" target="_blank">OPEN ➜</a>
              </div>
            </div> 
          </div>
            `
      );

      resultsContainer.appendChild(card);
      console.log(itemsList[i].Item.itemName);
    }
  }
  async fetchCDJapan(albumName, albumArtist) {}

  async fetchYAuctions(albumName, albumArtist) {}

  async fetchAmazon(albumName, albumArtist) {}
};

rhit.initializePage = () => {
  if (rhit.authManager._user) {
    document.querySelector(
      "nav > a"
    ).href = `profile.html?user=${rhit.authManager._user.uid}`;
  }

  if (document.querySelector("#collectionMain")) {
    new rhit.CollectionController();
  }

  if (document.querySelector("#profileMain")) {
    new rhit.ProfileController();
  }

  if (document.querySelector("#loginMain")) {
    new rhit.LoginController();
  }

  if (document.querySelector("#albumMain")) {
    let query = new URLSearchParams(window.location.search);
    let albumId = query.get("albumId");
    rhit.albumController = new rhit.AlbumController(albumId);
  }

  if (document.querySelector("#artistMain")) {
    let query = new URLSearchParams(window.location.search);
    let artistId = query.get("artistId");
    new rhit.ArtistController(artistId);
  }

  if (document.querySelector("#auctionMain")) {
    new rhit.AuctionController();
  }
  if (document.querySelector("#browseMain")) {
    new rhit.BrowseController();
  }
  if (document.querySelector("#entryMain")) {
    new rhit.EntryController();
  }
};

rhit.checkForRedirects = function () {
  if (document.querySelector("#loginMain") && rhit.fbAuthManager._user) {
    window.location.href = "/profile.";
  }
  if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
    window.location.href = "/";
  }
};

rhit.main = function () {
  // spotifyFetch();
  rhit.authManager = new rhit.AuthManager();
  rhit.authManager.beginListening(() => {
    if (rhit.authManager._user && document.querySelector("#loginMain"))
      window.location.href = `/profile.html?user=${rhit.authManager._user.uid}`;
    if (!document.querySelector("#loginMain") && !rhit.authManager._user) {
      window.location.href = "/";
    }
    rhit.initializePage();
  });

  // rhit.initiliazePage()
};

rhit.main();

async function spotifyFetch() {
  var client_id = "164fc02a060845e68191c2ee761ba0a9"; // Your client id
  var client_secret = "0cf20b5f897b4204badfccfec9521f5e"; // Your secret

  // your application requests authorization
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "client_credentials",
    },
    json: true,
  };
}

// request.post(authOptions, function (error, response, body) {
//   if (!error && response.statusCode === 200) {
//     // use the access token to access the Spotify Web API
//     var token = body.access_token;
//     var options = {
//       url: "https://api.spotify.com/v1/users/jmperezperez",
//       headers: {
//         Authorization: "Bearer " + token,
//       },
//       json: true,
//     };
//     request.get(options, function (error, response, body) {
//       console.log(body);
//     });
//   }

//   request.post(authOptions, function (error, response, body) {
//     if (!error && response.statusCode === 200) {
//       // use the access token to access the Spotify Web API
//       var token = body.access_token;
//       var options = {
//         url: "https://api.spotify.com/v1/users/bkhypj8h0u8uanrnci48ju0z1",
//         headers: {
//           Authorization: "Bearer " + token,
//         },
//         json: true,
//       };
//       request.get(options, function (error, response, body) {
//         console.log(body);
//       });
//     }
//   });
// });
