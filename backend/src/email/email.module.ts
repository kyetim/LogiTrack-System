import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';

@Global() // Make it available globally
@Module({
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule { }
