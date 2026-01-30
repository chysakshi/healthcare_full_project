import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageThread, ThreadMessage, User } from '../../core/models/healthcare.models';
import { AuthService } from '../../core/services/auth.service';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';

interface ConversationView {
  id: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  unreadCount: number;
  messages: ThreadMessage[];
}

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.page.html',
  styleUrl: './messages.page.scss'
})
export class MessagesPageComponent implements OnInit {
  protected currentUser: User | null = null;
  protected readonly conversations: ConversationView[] = [];
  protected selectedConversation: ConversationView | null = null;
  protected selectedConversationId = '';
  protected draftMessage = '';
  protected statusMessage = '';
  protected errorMessage = '';
  protected isLoading = true;

  private readonly usersMap = new Map<string, User>();

  constructor(
    private readonly authService: AuthService,
    private readonly healthcareDataService: HealthcareDataService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (!user) {
      this.errorMessage = 'Messaging is unavailable without an active session.';
      this.isLoading = false;
      return;
    }

    this.currentUser = user;

    this.healthcareDataService.getUsers().subscribe((users) => {
      this.usersMap.clear();
      users.forEach((entry) => this.usersMap.set(entry.id, entry));
      this.refreshConversations();
    });

    this.refreshConversations();
  }

  protected selectConversation(conversationId: string): void {
    this.selectedConversationId = conversationId;
    this.selectedConversation = this.conversations.find((conversation) => conversation.id === conversationId) ?? null;
    this.statusMessage = '';
    this.errorMessage = '';
    this.healthcareDataService.markThreadRead(conversationId);
  }

  protected sendMessage(): void {
    if (!this.currentUser || this.currentUser.role === 'admin') {
      return;
    }

    if (!this.selectedConversationId || !this.draftMessage.trim()) {
      this.errorMessage = 'Select a conversation and enter a message before sending.';
      this.statusMessage = '';
      return;
    }

    try {
      this.healthcareDataService.addThreadMessage({
        threadId: this.selectedConversationId,
        senderId: this.currentUser.id,
        senderRole: this.currentUser.role,
        content: this.draftMessage
      });
      this.draftMessage = '';
      this.statusMessage = 'Message sent successfully.';
      this.errorMessage = '';
      this.healthcareDataService.markThreadRead(this.selectedConversationId);
    } catch {
      this.errorMessage = 'Message could not be delivered for this conversation.';
      this.statusMessage = '';
    }
  }

  protected isOwnMessage(senderId: string): boolean {
    return this.currentUser?.id === senderId;
  }

  private refreshConversations(): void {
    if (!this.currentUser) {
      return;
    }

    this.healthcareDataService.getMessageThreadsForUser(this.currentUser.id, this.currentUser.role).subscribe((threads) => {
      this.conversations.splice(
        0,
        this.conversations.length,
        ...threads
          .slice()
          .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
          .map((thread) => this.mapConversation(thread))
      );

      if (!this.conversations.length) {
        this.selectedConversationId = '';
        this.selectedConversation = null;
      } else if (!this.selectedConversationId || !this.conversations.some((entry) => entry.id === this.selectedConversationId)) {
        this.selectedConversationId = this.conversations[0].id;
        this.selectedConversation = this.conversations[0];
        this.healthcareDataService.markThreadRead(this.selectedConversationId);
      } else {
        this.selectedConversation = this.conversations.find((entry) => entry.id === this.selectedConversationId) ?? null;
      }

      this.isLoading = false;
    });
  }

  private mapConversation(thread: MessageThread): ConversationView {
    return {
      id: thread.id,
      title: this.resolveConversationTitle(thread),
      subtitle: thread.lastMessage,
      updatedAt: new Date(thread.updatedAt).toLocaleString(),
      unreadCount: thread.unreadCount,
      messages: thread.messages
    };
  }

  private resolveConversationTitle(thread: MessageThread): string {
    if (!this.currentUser) {
      return 'Conversation';
    }

    if (this.currentUser.role === 'patient') {
      return this.usersMap.get(thread.doctorId)?.fullName ?? 'Assigned Doctor';
    }

    if (this.currentUser.role === 'doctor') {
      return this.usersMap.get(thread.patientId)?.fullName ?? 'Patient';
    }

    const patientName = this.usersMap.get(thread.patientId)?.fullName ?? 'Patient';
    const doctorName = this.usersMap.get(thread.doctorId)?.fullName ?? 'Doctor';
    return `${patientName} and ${doctorName}`;
  }
}