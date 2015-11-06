'use strict';

/**
 * This wraps interaction between the client device and the server-side Player
 * service. The Player service is the Player's view of the world, and the 
 * websocket between the client and this player-focused hub service should 
 * contain most of the back and forth required for interacting with the 
 * game (room/chat, inventory), and the leaderboard (storing/retrieving 
 * earned trophies and badges). 
 * 
 * @ngdoc service
 * @name playerApp.playerSocket
 * @description
 * # playerSocket
 * Factory in the playerApp.
 */
angular.module('playerApp')
  .factory('playerSocket',
  [          '$websocket','$log','user','auth','API',
    function ($websocket,  $log,  user,  auth,  API) {
    
      var ws;
      var websocketURL = API.WS_URL + user.profile.id;
      var id = 0;
     
      // Collection for holding data: play.room.html displays
      // this scrolling collection.
      var roomEvents = [];
      
      // Create a v1 websocket
      $log.debug("Opening player socket %o for %o",websocketURL, user.profile);
      ws = $websocket(websocketURL, { 
             useApplyAsync: true,
             reconnectIfNotNormalClose: true
           });
      
      // Restore some information from the session, like the bookmark (last seen message)
      var playerSession = angular.extend({}, angular.fromJson(localStorage.playerSession));

      // Clear the bookmark if the DB says we're in a different room than the local session does.
      if ( user.profile.location !== playerSession.roomId ) {
        delete playerSession.bookmark;
        playerSession.roomId = user.profile.location;
      }
      playerSession.username = user.profile.name;

      // On open, check in with the concierge
      ws.onOpen(function() {
        console.log('connection open');
        ws.send('ready,' + angular.toJson(playerSession, 0));
      });

      // On received message, push to the correct collection 
      ws.onMessage(function(event) {
        
        var comma = event.data.indexOf(',');
        var command = event.data.slice(0,comma);
        var payload = event.data.slice(comma+1);
        var target, res;
        
        if ( "ack" === command ) {
          res = parseJson(payload);
          playerSession.mediatorId = res.mediatorId;
          playerSession.roomId = res.roomId;
          playerSession.roomName = res.roomName;
        } else {
          comma = payload.indexOf(',');
          target = payload.slice(0,comma);
          payload = payload.slice(comma+1);
          res = parseJson(payload);
          res.id = id++;
          playerSession.bookmark = res.bookmark;
          
          switch (res.type) {
            case 'event':
              if ( res.content[user.profile.id] ) {
                res.content = res.content[user.profile.id];
              } else { 
                res.content = res.content['*'];
              }
              roomEvents.push(res);
              break;
            default:
              roomEvents.push(res);
              break;
          }
        }

      });

      // On error, report the error, and close the connection 
      // (try to reconnect)
      ws.onError(function(event) {
        $log.debug('connection Error', event);
      });

      // On close, close gracefully
      ws.onClose(function(event) {
        $log.debug('connection closed', event);
        localStorage.playerSession = angular.toJson(playerSession);
      });
      
      var parseJson = function(message) {
        var res;
        try {
          res = angular.fromJson(message);
        } catch(e) {
          $log.debug('parse %o %o', message, e);
          res = {username: user.username, content: message};
        }
        $log.debug('message: %o %o', message, res);
        return res;
      };
      
      var send = function(message) {
        var output = {
            username: user.profile.name, 
            userId: user.profile.id,
            content: message
        };
        
        $log.debug('message: %o', output);
        
        if ( message.charAt(0) == '/') {
          // echo command to user's screen
          roomEvents.push({
            type: 'command',
            content: message,
            id: id++
            });
          
          // Handle special cases here while we have the pieces
          if ( message === '/sos') {
            ws.send("sos,"+playerSession.roomId+",{}");
            return; // DONE/SENT!
          }
        }

        ws.send("room,"+playerSession.roomId+","+angular.toJson(output));
      };
      
      // Available methods and structures
      var sharedApi = {
        roomEvents: roomEvents,
        playerSession: playerSession,
        send: send
      };

      return sharedApi;
  }
 
  
  
  ]);