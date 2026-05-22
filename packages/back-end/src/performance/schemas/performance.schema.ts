import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Performance extends Document {
  @Prop({ required: true })
  pageUrl: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ required: true })
  timestamp: number;

  @Prop()
  fcp?: number;

  @Prop()
  lcp?: number;

  @Prop()
  cls?: number;

  @Prop()
  fid?: number;

  @Prop()
  ttfb?: number;

  @Prop()
  inp?: number;

  @Prop()
  navigationType: string;

  @Prop()
  connectionInfo?: string;

  @Prop()
  type?: string;

  @Prop()
  url?: string;

  @Prop()
  method?: string;

  @Prop()
  startTime?: number;

  @Prop()
  duration?: number;

  @Prop()
  status?: number;

  @Prop()
  size?: number;
}

export const PerformanceSchema = SchemaFactory.createForClass(Performance);
