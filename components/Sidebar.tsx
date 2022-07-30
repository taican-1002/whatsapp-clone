//style
import styled from "styled-components";
//mui
import {
  Avatar,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  DialogActions,
  IconButton,
  Tooltip,
  TextField,
} from "@mui/material";
import {
  Chat as ChatIcon,
  MoreVert as MoreVertIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
//firebase
import { signOut } from "firebase/auth";
import { addDoc, collection, query, where } from "firebase/firestore";
//component
import { auth, db } from "../config/firebase";
import { Conversation } from "../types";
import ConversationSelect from "./ConversationSelect";
//react
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
//email validator
import * as EmailValidator from "email-validator";
const StyledContainer = styled.div`
  height: 100vh;
  min-width: 300px;
  max-width: 350px;
  overflow-y: scroll;
  border-right: 1px solid whitesmoke;
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;
const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  height: 80px;
  border-bottom: 1px solid whitesmoke;
  top: 0;
  position: sticky;
  z-index: 1;
  background-color: #fff;
`;
const StyledSearch = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 2px;
`;
const StyledSearchInput = styled.input`
  outline: none;
  border: none;
  flex: 1;
`;

const StyledSidebarButton = styled(Button)`
  width: 100%;
  border-top: 1px solid whitesmoke;
  border-bottom: 1px solid whitesmoke;
`;
const StyledUserAvatar = styled(Avatar)`
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`;

const Sidebar = () => {
  const [loggedInUser, _loading, _error] = useAuthState(auth);

  const [isOpenNewConversationDialog, setIsOpenNewConversationDialog] =
    useState(false);

  const [recipientEmail, setRecipientEmail] = useState("");

  const toggleNewConversationDialog = (isOpen: boolean) => {
    setIsOpenNewConversationDialog(isOpen);

    if (!isOpen) setRecipientEmail("");
  };

  const handleCloseNewConversationDialog = () => {
    toggleNewConversationDialog(false);
  };

  //check if conversation already exists between the current logged in user and recipientEmail
  const queryGetConversationsForCurrentUser = query(
    collection(db, "conversations"),
    where("users", "array-contains", loggedInUser?.email)
  );

  const [conversationsSnapshot, __loading, __error] = useCollection(
    queryGetConversationsForCurrentUser
  );

  const isConversationAlreadyExists = (recipientEmail: string) =>
    conversationsSnapshot?.docs.find((conversation) =>
      (conversation.data() as Conversation).users.includes(recipientEmail)
    );

  const isInvitingSelf = recipientEmail === loggedInUser?.email;

  const createNewConversationDialog = async () => {
    if (!recipientEmail) return;
    if (
      EmailValidator.validate(recipientEmail) &&
      !isInvitingSelf &&
      !isConversationAlreadyExists(recipientEmail)
    ) {
      // add conversation user to db "conversation" collection
      // A conversation is between the currently logged in user and the user invited

      await addDoc(collection(db, "conversations"), {
        users: [loggedInUser?.email, recipientEmail],
      });
    }
    handleCloseNewConversationDialog();
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Error logging out", error);
    }
  };
  return (
    <StyledContainer>
      <StyledHeader>
        <Tooltip title={loggedInUser?.email as string} placement="right">
          <StyledUserAvatar src={loggedInUser?.photoURL || ""} />
        </Tooltip>

        <div>
          <IconButton>
            <ChatIcon />
          </IconButton>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
          <IconButton onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </div>
      </StyledHeader>
      <StyledSearch>
        <SearchIcon />
        <StyledSearchInput placeholder="Search in conversation" />
      </StyledSearch>
      <StyledSidebarButton onClick={() => toggleNewConversationDialog(true)}>
        Start a new conversation
      </StyledSidebarButton>
      {/* List of conversation */}
      {conversationsSnapshot?.docs.map((conversation) => (
        <ConversationSelect
          key={conversation.id}
          id={conversation.id}
          conversationUsers={(conversation.data() as Conversation).users}
        />
      ))}

      <Dialog
        open={isOpenNewConversationDialog}
        onClose={handleCloseNewConversationDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle>"New conversation"</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter a Google email address for the user you wish to chat
            with
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewConversationDialog}>Cancel</Button>
          <Button
            disabled={!recipientEmail}
            onClick={createNewConversationDialog}
            autoFocus
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </StyledContainer>
  );
};

export default Sidebar;
