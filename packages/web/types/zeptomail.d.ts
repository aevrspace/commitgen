// ./types/zeptomail.d.ts

declare module "zeptomail" {
  export interface SendMailClientConfig {
    url: string;
    token: string;
  }

  export interface MailResponse {
    messageId?: string;
    data?: {
      request_id?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  export class SendMailClient {
    constructor(config: SendMailClientConfig);
    sendMail(payload: Record<string, unknown>): Promise<MailResponse>;
    sendMailWithTemplate(
      payload: Record<string, unknown>
    ): Promise<MailResponse>;
  }
}
