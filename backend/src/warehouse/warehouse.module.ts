import { Module } from '@nestjs/common';
import { PickListsModule } from './pick-lists/pick-lists.module';
import { ScanModule } from './scan/scan.module';

@Module({
  imports: [PickListsModule, ScanModule],
})
export class WarehouseModule {}
