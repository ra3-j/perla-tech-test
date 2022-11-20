var userName = document.getElementById("userName");

var selectRoomDiv = document.getElementById("selectedRoom");
var consultingRoomDiv = document.getElementById("room");
var roomNameInput = document.getElementById("roomName");
var enterTheRoomBtn = document.getElementById("enterRoomBtn");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

var sendMessageBtn = document.getElementById("sendMessageBtn");
var textChatField = document.getElementById("textChatField");
var textChatArea = document.getElementById("textChatArea");
var sentMessage;

var roomName;
var localStream;
var remoteStream;
var rtcPeerConnection;
var iceServers = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' }
    ]
}
var streamConstraints = { audio: true, video: true };
var isCaller;
var socket = io('http://localhost:3000');

//create or join a group
enterTheRoomBtn.onclick = function () {
    if (!roomNameInput.value) {
        alert("Please Enter The Room Name")
    } else {
        roomName = roomNameInput.value;
        socket.emit('create or join', roomName);
        selectRoomDiv.style = "display: none;";
        consultingRoomDiv.style = "display: block;";
    }
};

socket.on('created', function (room) {
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        isCaller = true;
    }).catch(function (err) {
        console.log('Access to media devices failed: ', err);
    });
});

socket.on('joined', function (room) {
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        socket.emit('ready', roomName);
    }).catch(function (err) {
        console.log('Access to media devices failed: ', err);
    });
});

socket.on('candidate', function (event) {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    rtcPeerConnection.addIceCandidate(candidate);
});

socket.on('ready', function () {
    if (isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomName
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('offer', function (event) {
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomName
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('answer', function (event) {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
})

function onIceCandidate(event) {
    if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit('candidate', {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomName
        })
    }
}

function onAddStream(event) {
    remoteVideo.srcObject = event.streams[0];
    remoteStream = event.stream;
}

//send a message
sendMessageBtn.onclick = function () {
    if(!userName.value){
        alert("Please Enter Your Username");
    }else{
        if (!textChatField.value) {
            alert("Please Type a Message")
        } else {
            sentMessage = textChatField.value;
            socket.emit('sendMessage', sentMessage,roomName,userName.value);
            textChatArea.style = "display: block;";
            textChatArea.value += `Me: ${sentMessage}\n`;
        }
    }
};

socket.on('receiveMessage',(message,sender)=>{
    textChatArea.style = "display: block;";
    if(sender === userName.value){
        textChatArea.value += `Me: ${message.toString()}\n`;
    }else{
        textChatArea.value += `${sender}: ${message.toString()}\n`;
    }
})