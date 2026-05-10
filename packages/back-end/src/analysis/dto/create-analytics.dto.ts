import { IsString, IsObject, IsNotEmpty } from 'class-validator';

export class CreateAnalyticsDto {
  @IsString()
  eventName!: string;

  @IsObject()
  properties!: Record<string, any>;

  @IsNotEmpty()
  timestamp!: number;

  @IsString()
  userId: string;

  @IsString()
  url: string;

  @IsString()
  ua: string;
}
