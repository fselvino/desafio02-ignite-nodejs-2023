import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database' // nunca importar de knex diretamente

export async function usersRoutes(app: FastifyInstance) {
  // Rota para criação de usuário
  app.post('/', async (request, reply) => {
    // Cria schema de validaçao de dados que viram da aplicação
    const createUserSchema = z.object({
      email: z.string(),
    })

    const { email } = createUserSchema.parse(request.body)

    // recupera cookie caso exista
    let sessionId = request.cookies.sessionId

    // testa se existe cookie sessionId
    if (!sessionId) {
      sessionId = randomUUID()
    }

    // passa o cookie criado para aplicação
    reply.cookie('sessionId', sessionId, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days em milisegundos
    })

    await knex('users').insert({
      id: sessionId,
      email,
    })
    return reply.status(201).send()
  })
  app.get('/', async () => {
    const user = await knex('users').select()

    return {
      user,
    }
  })

  // rota para realizar login do usuario cadastrado
  app.get('/:id', async (request, reply) => {
    const getUserSchema = z.object({
      id: z.string().uuid(),
    })

    // retorna e valida o usuario atual
    const { id } = getUserSchema.parse(request.params)

    // recupera cookie caso exista
    const sessionId = request.cookies.sessionId
    // console.log(sessionId)

    const user = await knex('users').where({ id }).first()

    // Verifica se o exist existe, caso negativo retorna mensagem de erro
    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized.',
      })
    }

    if (id !== sessionId) {
      reply.cookie('sessionId', id, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days em milisegundos
      })
    }

    // console.log(sessionId)

    // const userr = await knex('users').where({ id }).first()
    // console.log(user)
    // return {
    //   user,
    // }
  })
}
