import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { LocationsModule } from './locations/locations.module';
import { StockModule } from './stock/stock.module';

@Module({
  imports: [CategoriesModule, ProductsModule, LocationsModule, StockModule],
})
export class InventoryModule {}
