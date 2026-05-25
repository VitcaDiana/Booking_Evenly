import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe ({
    whitelist: true,  //elimina automat campurile care nu sunt in DTO
    forbidNonWhitelisted: true,  //returneaza eroare daca trimiti campuri extra
    transform: true,  //transforma automat tipurile
  }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
