const functions = require("firebase-functions");
var express = require("express");
var axios = require("axios");
var request = require("request")
var cors = require("cors");

let app = express();
app.use(cors())

app.get("/api/artistInfo/:id", async (req, res) => {


  let client_id = "164fc02a060845e68191c2ee761ba0a9"
  let client_secret = "0cf20b5f897b4204badfccfec9521f5e"
  let artistId = req.params.id;

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var token = body.access_token;

      axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
          "Authorization": "Bearer " + token
        }
      }).then(resp => resp.data).then(artistObj => {
        axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=ES`, {
          headers: {
            "Authorization": "Bearer " + token
          }
        }).then(res => res.data)
          .then(tracks => {
            let previewTrack = tracks.tracks[0];
            const albumImg = previewTrack.album.images[0].url;
            const name = previewTrack.name;
            let artists = previewTrack.artists.map(art => art.name)
            const previewUrl = previewTrack.preview_url;

            res.send({ 
              previewTrack: { 
                previewUrl: previewUrl,
                imageUrl: albumImg,
                name: name,
                artists: artists
              }, 
              artist: artistObj })
            res.end();
          })

        // res.send(data)
        //   res.end();
      })
    }
  })

})

app.get("/api/albumInfo/:id", async (req, res) => {

  let client_id = "164fc02a060845e68191c2ee761ba0a9"
  let client_secret = "0cf20b5f897b4204badfccfec9521f5e"
  let albumId = req.params.id;

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var token = body.access_token;

      axios.get(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: {
          "Authorization": "Bearer " + token
        }
      }).then(resp => resp.data).then(data => {
        res.send(data)
        res.end();
      })
    }
  })
})


app.get("/api/previewTrack/:id", async (req, res) => {


  let client_id = "164fc02a060845e68191c2ee761ba0a9"
  let client_secret = "0cf20b5f897b4204badfccfec9521f5e"
  let artistId = req.params.id;

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };

  request.get(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var token = body.access_token;

      axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=ES`, {
        headers: {
          "Authorization": "Bearer " + token
        }
      }).then(resp => resp.data).then(data => {
        // console.log(data);
        res.send(data)
        res.end();
      })
        .catch(err => {
          // console.log(err)
          res.send({ message: "Preview fetch failed" })
          res.end();
        })
    }
  })

})


exports.api = functions.https.onRequest(app);