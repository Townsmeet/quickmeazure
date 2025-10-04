declare module 'sib-api-v3-sdk' {
  namespace ApiClient {
    const instance: unknown
  }

  // Define the interface for the email structure
  interface SendSmtpEmailData {
    subject: string
    htmlContent: string
    textContent?: string
    sender: {
      name: string
      email: string
    }
    to: Array<{
      email: string
      name?: string
    }>
    replyTo?: {
      email: string
      name?: string
    }
    headers?: Record<string, string>
    params?: Record<string, unknown>
  }

  // Define the class that implements the interface
  class SendSmtpEmail implements SendSmtpEmailData {
    subject!: string
    htmlContent!: string
    textContent?: string
    sender!: {
      name: string
      email: string
    }
    to!: Array<{
      email: string
      name?: string
    }>
    replyTo?: {
      email: string
      name?: string
    }
    headers?: Record<string, string>
    params?: Record<string, unknown>

    constructor()
  }

  class TransactionalEmailsApi {
    sendTransacEmail(sendSmtpEmail: SendSmtpEmail): Promise<{ messageId: string }>
  }
}
