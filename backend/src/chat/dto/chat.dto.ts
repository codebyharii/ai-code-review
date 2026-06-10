import { IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty({ message: 'Message content cannot be empty.' })
  message!: string;
}
