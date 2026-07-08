import { SetMetadata } from '@nestjs/common';

// Marks a route as not requiring authentication, even though JwtAuthGuard
// is applied globally-ish at the controller level.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
