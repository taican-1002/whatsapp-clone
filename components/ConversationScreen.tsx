// mui
import {
  AttachFile as AttachFileIcon,
  InsertEmoticon as InsertEmoticonIcon,
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  Mic as MicIcon,
} from "@mui/icons-material";
import { IconButton } from "@mui/material";
//firebase
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
//next
import { useRouter } from "next/router";
//react
import React, {
  KeyboardEventHandler,
  MouseEventHandler,
  useState,
  useRef,
} from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
//style
import styled from "styled-components";
//component
import { auth, db } from "../config/firebase";
import { useRecipient } from "../hooks/useRecipient";
import { Conversation, IMessage } from "../types";
import {
  convertFirestoreTimestampToString,
  generateQueryGetMessages,
  transformMessage,
} from "../utils/getMessagesInConversation";
import Message from "./Message";
import RecipientAvatar from "./RecipientAvatar";

const StyledRecipientHeader = styled.div`
  position: sticky;
  background-color: white;
  z-index: 100;
  top: 0;
  display: flex;
  align-items: center;
  padding: 11px;
  height: 80px;
  border-bottom: 1px solid whitesmoke;
`;

const StyledHeaderInfo = styled.div`
  flex-grow: 1;

  > h3 {
    margin-top: 0;
    margin-bottom: 3px;
  }

  > span {
    font-size: 14px;
    color: gray;
  }
`;

const StyledH3 = styled.h3`
  word-break: break-all;
`;

const StyledHeaderIcon = styled.div`
  display: flex;
`;

const StyledMessageContainer = styled.div`
  padding: 30px;
  background-color: #e5ded8;
  min-height: 90vh;
`;

const StyledInputContainer = styled.form`
  display: flex;
  align-items: center;
  padding: 10px;
  position: sticky;
  bottom: 0;
  background-color: white;
  z-index: 100;
`;
const StyledInput = styled.input`
  flex-grow: 1;
  outline: none;
  border: none;
  border-radius: 10px;
  background-color: whitesmoke;
  padding: 15px;
  margin-left: 15px;
  margin-right: 15px;
`;

const EndOfMessageForAutoScroll = styled.div`
  margin-bottom: 30px;
`;

const ConversationScreen = ({
  conversation,
  messages,
}: {
  conversation: Conversation;
  messages: IMessage[];
}) => {
  const [newMessage, setNewMessage] = useState("");

  const [loggedInUser, _loading, _error] = useAuthState(auth);

  const conversationUsers = conversation.users;

  const { recipientEmail, recipient } = useRecipient(conversationUsers);

  const router = useRouter();

  const conversationId = router.query.id; //localhost:3000/conversation/:id

  const queryGetMessages = generateQueryGetMessages(conversationId as string);

  const [messagesSnapshot, messagesLoading, __error] =
    useCollection(queryGetMessages);

  const showMessages = () => {
    //n???u giao di???n ng?????i d??ng ??ang t???i th??ng b??o ??? h???u tr?????ng, hi???n th??? th??ng b??o ???????c truy xu???t t??? ??????SSR Ti???p theo (???????c chuy???n xu???ng t??? [id] .tsx)
    if (messagesLoading) {
      return messages.map((message) => (
        <Message key={message.id} message={message} />
      ));
    }
    //n???u giao di???n ng?????i d??ng ???? t???i xong tin nh???n, v?? v???y b??y gi??? ch??ng ta c?? messageSnapshot
    if (messagesSnapshot) {
      transformMessage;
      return messagesSnapshot?.docs.map((message, index) => (
        <Message key={message.id} message={transformMessage(message)} />
      ));
    }

    return null;
  };

  const addMessageToDbAndUpdateLastSeen = async () => {
    //update last seen in "user" collection
    await setDoc(
      doc(db, "users", loggedInUser?.email as string),
      {
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    ); //just update what is changed

    // add new message to "messages" collection
    await addDoc(collection(db, "messages"), {
      conversation_id: conversationId,
      sent_at: serverTimestamp(),
      text: newMessage,
      user: loggedInUser?.email,
    });

    //reset input
    setNewMessage("");
    //scroll to bottom
    scrollToBottom();
  };

  const sendMessageOnEnter: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!newMessage) return;
      addMessageToDbAndUpdateLastSeen();
    }
  };

  const sendMessageOnClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    if (!newMessage) return;
    addMessageToDbAndUpdateLastSeen();
  };

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <StyledRecipientHeader>
        <RecipientAvatar
          recipient={recipient}
          recipientEmail={recipientEmail}
        />

        <StyledHeaderInfo>
          <StyledH3>{recipientEmail}</StyledH3>
          {recipient && (
            <span>
              Last active:{""}
              {convertFirestoreTimestampToString(recipient.lastSeen)}
            </span>
          )}
        </StyledHeaderInfo>
        <StyledHeaderIcon>
          <IconButton>
            <AttachFileIcon />
          </IconButton>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </StyledHeaderIcon>
      </StyledRecipientHeader>

      <StyledMessageContainer>
        {showMessages()}
        {/**for auto scroll to the end when a new message is sent */}
        <EndOfMessageForAutoScroll ref={endOfMessagesRef} />
      </StyledMessageContainer>

      <StyledInputContainer>
        <InsertEmoticonIcon />
        <StyledInput
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={sendMessageOnEnter}
        />
        <IconButton onClick={sendMessageOnClick} disabled={!newMessage}>
          <SendIcon />
        </IconButton>
        <IconButton>
          <MicIcon />
        </IconButton>
      </StyledInputContainer>
    </>
  );
};

export default ConversationScreen;
