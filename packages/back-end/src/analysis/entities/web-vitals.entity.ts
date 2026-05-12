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

  @Column({ name: 'event_name', length: 50 })
  eventName: string;

  @Column({ name: 'user_id', nullable: true, length: 100 })
  userId: string;

  @Column({ name: 'url', type: 'text' })
  url: string;

  @Column({ name: 'metrics', type: 'jsonb' })
  metrics: {
    lcp?: { value: number; rating: string; navigationType?: string };
    fcp?: { value: number; rating: string; navigationType?: string };
    cls?: { value: number; rating: string; navigationType?: string };
    fid?: { value: number; rating: string; navigationType?: string };
    ttfb?: { value: number; rating: string; navigationType?: string };
  };

  @Column({ name: 'navigation_type', nullable: true, length: 20 })
  navigationType: string;

  @Index()
  @Column({ name: 'timestamp', type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
