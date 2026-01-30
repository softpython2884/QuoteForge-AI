import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
// import { AiController } from './ai.controller'; // Future

@Module({
    providers: [AiService],
    exports: [AiService],
})
export class AiModule { }
