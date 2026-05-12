import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('web_vitals_events')
export class WebVitalsEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  eventName: string;

  @Column({ nullable: true, length: 100 })
  userId: string;

  @Column({ type: 'text' })
  url: string;

  @Column('jsonb')
  metrics: {
    lcp?: { value: number; rating: string; navigationType?: string };
    fcp?: { value: number; rating: string; navigationType?: string };
    cls?: { value: number; rating: string; navigationType?: string };
    fid?: { value: number; rating: string; navigationType?: string };
    ttfb?: { value: number; rating: string; navigationType?: string };
  };

  @Column({ nullable: true, length: 20 })
  navigationType: string;

  @Index()
  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
