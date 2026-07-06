import { MemorySaver } from '@langchain/langgraph';
import { RedisSaver } from '@langchain/langgraph-checkpoint-redis';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { MemoryConfig } from '../../memory.types';

export async function createCheckpointer(config: MemoryConfig) {
  switch (config.checkpointerType) {
    case 'redis':
      return RedisSaver.fromUrl(config.redisUrl!);
    case 'postgres': {
      const saver = PostgresSaver.fromConnString(config.postgresConnString!);
      await saver.setup();
      return saver;
    }
    default:
      return new MemorySaver();
  }
}
