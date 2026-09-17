import { Module } from '@nestjs/common';
import { PickListsService } from './pick-lists.service';
import { PickListsController } from './pick-lists.controller';
import { InventoryModule } from '../../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [PickListsController],
  providers: [PickListsService],
  exports: [PickListsService],
})
export class PickListsModule {}
