//firebase
import { doc, getDoc, getDocs } from "firebase/firestore";
//next
import { GetServerSideProps } from "next";
import Head from "next/head";
//react
import { useAuthState } from "react-firebase-hooks/auth";
//style
import styled from "styled-components";
//component
import ConversationScreen from "../../components/ConversationScreen";
import Sidebar from "../../components/Sidebar";
import { auth, db } from "../../config/firebase";
import { Conversation, IMessage } from "../../types";
import {
  generateQueryGetMessages,
  transformMessage,
} from "../../utils/getMessagesInConversation";
import { getRecipientEmail } from "../../utils/getRecipientEmail";

const StyledContainer = styled.div`
  display: flex;
`;

const StyledConversationContainer = styled.div`
  flex-grow: 1;
  overflow: scroll;
  height: 100vh;
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

interface Props {
  conversation: Conversation;
  messages: IMessage[];
}

const Conversation = ({ conversation, messages }: Props) => {
  const [loggedInUser, _loading, _error] = useAuthState(auth);
  return (
    <StyledContainer>
      <Head>
        <title>
          Conversation with {""}
          {getRecipientEmail(conversation.users, loggedInUser)}
        </title>
      </Head>
      <Sidebar />

      <StyledConversationContainer>
        <ConversationScreen conversation={conversation} messages={messages} />
      </StyledConversationContainer>
    </StyledContainer>
  );
};

export default Conversation;

//server side rendering
export const getServerSideProps: GetServerSideProps<
  Props,
  { id: string }
> = async (context) => {
  const conversationId = context.params?.id;

  //lấy conversation để biết chúng ta đang chat với ai
  const conversationRef = doc(db, "conversations", conversationId as string);
  const conversationSnapshot = await getDoc(conversationRef);

  //lấy tất cả tin nhắn giữa người dùng đã đăng nhập và người nhận trong cuộc trò chuyện này
  const queryMessages = generateQueryGetMessages(conversationId);

  const messagesSnapshot = await getDocs(queryMessages);

  const messages = messagesSnapshot.docs.map((messageDoc) =>
    transformMessage(messageDoc)
  );
  return {
    props: {
      conversation: conversationSnapshot.data() as Conversation,
      messages,
    },
  };
};
