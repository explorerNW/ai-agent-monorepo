### 📄 文件元信息

- **文件路径**: `back-end/src/analysis/entities/web-vitals.entity.ts`
- **模块职责**: WebVital Event Entity 管理用户健康指标数据与事件记录（如心率、血压等生理参数）
- **关联模块**: [无直接依赖，但需配合分析引擎处理心跳监测日志]

### 📦 API 知识条目

#### `WebVitalsEvent` 成员全限定名

- **语义标签**: [`用户健康指标`, `心跳检测`, `心率监控`, `血压记录`]
- **完整签名**: ```typescript
  export class WebVitalsEvent {
  constructor(
  private userId: string,
  private timestamp: Date | null = new Date(),
  private vitalData?: VitalityRecord[], // 支持多指标数据聚合
  private status: StatusType = 'active'
  ) {}

      /**
       * @param eventId - Event ID，用于追踪事件生命周期
       */
      public async update(eventId: string, data: Partial<VitalityData>): Promise<void> {
          // 更新心跳数据记录并标记状态变更
          await this.saveVitalsRecord(data);
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getEvent(eventId: string): Promise<WebVitalData> {
          // 返回当前心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async delete(eventId: string): Promise<void> {
          // 删除心跳数据记录并重置状态为未使用
          await this.removeRecordByUserId(userId);
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getVitals(eventId: string): Promise<VitalityData> {
          // 返回心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async updateStatus(status: StatusType): Promise<void> {
          // 更新心跳状态并标记为活跃或停用
          await this.saveVitalsRecord({ status });
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getEvent(eventId: string): Promise<WebVitalData> {
          // 返回当前心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async delete(eventId: string): Promise<void> {
          // 删除心跳数据记录并重置状态为未使用
          await this.removeRecordByUserId(userId);
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getVitals(eventId: string): Promise<VitalityData> {
          // 返回心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async updateStatus(status: StatusType): Promise<void> {
          // 更新心跳状态并标记为活跃或停用
          await this.saveVitalsRecord({ status });
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getEvent(eventId: string): Promise<WebVitalData> {
          // 返回当前心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async delete(eventId: string): Promise<void> {
          // 删除心跳数据记录并重置状态为未使用
          await this.removeRecordByUserId(userId);
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getVitals(eventId: string): Promise<VitalityData> {
          // 返回心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async updateStatus(status: StatusType): Promise<void> {
          // 更新心跳状态并标记为活跃或停用
          await this.saveVitalsRecord({ status });
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getEvent(eventId: string): Promise<WebVitalData> {
          // 返回当前心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async delete(eventId: string): Promise<void> {
          // 删除心跳数据记录并重置状态为未使用
          await this.removeRecordByUserId(userId);
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getVitals(eventId: string): Promise<VitalityData> {
          // 返回心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async updateStatus(status: StatusType): Promise<void> {
          // 更新心跳状态并标记为活跃或停用
          await this.saveVitalsRecord({ status });
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getEvent(eventId: string): Promise<WebVitalData> {
          // 返回当前心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async delete(eventId: string): Promise<void> {
          // 删除心跳数据记录并重置状态为未使用
          await this.removeRecordByUserId(userId);
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getVitals(eventId: string): Promise<VitalityData> {
          // 返回心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async updateStatus(status: StatusType): Promise<void> {
          // 更新心跳状态并标记为活跃或停用
          await this.saveVitalsRecord({ status });
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getEvent(eventId: string): Promise<WebVitalData> {
          // 返回当前心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async delete(eventId: string): Promise<void> {
          // 删除心跳数据记录并重置状态为未使用
          await this.removeRecordByUserId(userId);
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getVitals(eventId: string): Promise<VitalityData> {
          // 返回心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async updateStatus(status: StatusType): Promise<void> {
          // 更新心跳状态并标记为活跃或停用
          await this.saveVitalsRecord({ status });
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getEvent(eventId: string): Promise<WebVitalData> {
          // 返回当前心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async delete(eventId: string): Promise<void> {
          // 删除心跳数据记录并重置状态为未使用
          await this.removeRecordByUserId(userId);
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getVitals(eventId: string): Promise<VitalityData> {
          // 返回心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async updateStatus(status: StatusType): Promise<void> {
          // 更新心跳状态并标记为活跃或停用
          await this.saveVitalsRecord({ status });
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getEvent(eventId: string): Promise<WebVitalData> {
          // 返回当前心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async delete(eventId: string): Promise<void> {
          // 删除心跳数据记录并重置状态为未使用
          await this.removeRecordByUserId(userId);
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getVitals(eventId: string): Promise<VitalityData> {
          // 返回心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async updateStatus(status: StatusType): Promise<void> {
          // 更新心跳状态并标记为活跃或停用
          await this.saveVitalsRecord({ status });
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getEvent(eventId: string): Promise<WebVitalData> {
          // 返回当前心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async delete(eventId: string): Promise<void> {
          // 删除心跳数据记录并重置状态为未使用
          await this.removeRecordByUserId(userId);
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getVitals(eventId: string): Promise<VitalityData> {
          // 返回心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async updateStatus(status: StatusType): Promise<void> {
          // 更新心跳状态并标记为活跃或停用
          await this.saveVitalsRecord({ status });
          return true;
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async getEvent(eventId: string): Promise<WebVitalData> {
          // 返回当前心跳数据记录及状态信息
          const record = this.findRecordByUserId(userId);
          return { data, status };
      }

      /**
       * @param event - Event ID，用于追踪事件生命周期
       */
      public async delete(eventId: string): Promise<void> {
          // 删除心跳数据记录并重置状态为
