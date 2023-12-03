import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database' // nunca importar de knex diretamente

export async function mealsRoutes(app: FastifyInstance) {
  // Cria refeições e persiste no banco de dados
  app.post('/', async (request, reply) => {
    // schema para tratar os dados que vem da aplicação
    const createMealsSchema = z.object({
      name: z.string(),
      description: z.string(),
      diet: z.boolean(),
    })

    // recupera as informações da aplicação aplicando a validação do schema definido
    const { name, description, diet } = createMealsSchema.parse(request.body)

    // recupera o cookie atual da aplicação o qual tambem é o id do usuario atual
    const sessionId = request.cookies.sessionId

    // popula a variavel com as informaçoes a serem persistidas no banco
    const meal = {
      id: randomUUID(),
      name,
      description,
      diet,
      session_id: sessionId,
    }

    // insere no banco de dados
    await knex('meals').insert(meal)

    return reply.status(201).send()
  })

  // lista todas refeições realizadas pelo usuario logado
  app.get('/', async (request, reply) => {
    // recupera o cookie atual da aplicação o qual tambem é o id do usuario atual e logado
    const sessionId = request.cookies.sessionId

    // verifica se existe o usuario que quer logar, se não existir retorno erro não autorizado
    if (!sessionId) {
      return reply.status(401).send({
        error: 'Unauthorized.',
      })
    }
    // console.log(sessionId)

    // retorna todas refeições realizadas pelo usuario logado
    const meals = await knex('meals')
      .where('session_Id', '=', sessionId)
      .select('*')

    // Calcula o total de refeições realizadas pelo usuario logado
    const mealsTotal = await knex('meals')
      .where({ session_id: sessionId })
      .count('id', { as: 'total' })
      .first()

    // Calcula total de refeições dentro da dieta
    const mealsDiet = await knex('meals')
      .where({ diet: true, session_id: sessionId })
      .count('diet', { as: 'diet' })
      .first()

    // Calcula total de refeições fora da dieta
    const mealsNoDiet = await knex('meals')
      .where({ diet: false, session_id: sessionId })
      .count('diet', { as: 'noDiet' })
      .first()

    return {
      mealsTotal,
      mealsDiet,
      mealsNoDiet,
      meals,
    }
  })

  // lista uma determinada refeiçao feito por um usuario logado
  app.get('/:id', async (request, reply) => {
    // recupera o cookie atual da aplicação o qual tambem é o id do usuario atual e logado
    const sessionId = request.cookies.sessionId

    // verifica se existe o usuario que quer logar, se não existir retorno erro não autorizado
    if (!sessionId) {
      return reply.status(401).send({
        error: 'Unauthorized.',
      })
    }

    // cria schema que irá validar o id da refeição vido da aplicação
    const getMealSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = getMealSchema.parse(request.params) // id da refeição
    // console.log(id)

    // retorna uma refeição especifica do usuario logado
    const meal = await knex('meals')
      .where({ id, session_id: sessionId })
      .first()

    return {
      meal,
    }
  })

  // sumariza as refeições
  app.get('/summary', async (request, reply) => {
    // recupera o cookie atual da aplicação o qual tambem é o id do usuario atual e logado
    const sessionId = request.cookies.sessionId

    // verifica se existe o usuario que quer logar, se não existir retorno erro não autorizado
    if (!sessionId) {
      return reply.status(401).send({
        error: 'Unauthorized.',
      })
    }

    // Calcula o total de refeições realizadas pelo usuario logado
    const mealsTotal = await knex('meals')
      .where({ session_id: sessionId })
      .count('id', { as: 'total' })
      .first()

    // Calcula total de refeições dentro da dieta
    const mealsDiet = await knex('meals')
      .where({ diet: true, session_id: sessionId })
      .count('diet', { as: 'diet' })
      .first()

    // Calcula total de refeições fora da dieta
    const mealsNoDiet = await knex('meals')
      .where({ diet: false, session_id: sessionId })
      .count('diet', { as: 'noDiet' })
      .first()

    // retorna para aplicação os totais
    return {
      mealsTotal,
      mealsDiet,
      mealsNoDiet,
    }
  })

  // lista uma determinada refeiçao feito por um usuario logado
  app.patch('/:id', async (request, reply) => {
    // schema para tratar os dados que vem da aplicação
    const createMealsSchema = z.object({
      name: z.string(),
      description: z.string(),
      diet: z.boolean(),
    })

    // recupera as informações da aplicação aplicando a validação do schema definido
    // eslint-disable-next-line camelcase
    const { name, description, diet } = createMealsSchema.parse(request.body)

    // recupera o cookie atual da aplicação o qual tambem é o id do usuario atual e logado
    const sessionId = request.cookies.sessionId

    // verifica se existe o usuario que quer logar, se não existir retorno erro não autorizado
    if (!sessionId) {
      return reply.status(401).send({
        error: 'Unauthorized.',
      })
    }

    // cria schema que irá validar o id da refeição vido da aplicação
    const getMealSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = getMealSchema.parse(request.params) // id da refeição

    // console.log(id)

    /**
     * Houve a necessidade de tratar a data para quando atulizar a data ficar no mesmo padrão
     */
    const dataAtual = new Date()
    // eslint-disable-next-line camelcase
    const created_at = dataAtual.toLocaleString('sv-SE') // O padrão  sueco  { aaaa-mm-dd hh:mm:ss }

    // eslint-disable-next-line camelcase
    const session_id = sessionId
    const data = {
      id,
      // eslint-disable-next-line camelcase
      session_id,
      name,
      description,
      diet,
      // eslint-disable-next-line camelcase
      created_at,
    }
    await knex('meals')
      .where({ id, session_id: sessionId })
      // eslint-disable-next-line camelcase
      .update({ ...data })
      .select('*')

    return reply.status(204).send()
  })

  // Delete uma determinada refeição pelo usuario logado
  app.delete('/:id', async (request, reply) => {
    // recupera o cookie atual da aplicação o qual tambem é o id do usuario atual e logado
    const sessionId = request.cookies.sessionId

    // verifica se existe o usuario que quer logar, se não existir retorno erro não autorizado
    if (!sessionId) {
      return reply.status(401).send({
        error: 'Unauthorized.',
      })
    }

    // cria schema que irá validar o id da refeição vido da aplicação
    const getMealSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = getMealSchema.parse(request.params) // id da refeição

    // Deleta a refeição
    await knex('meals')
      .where({
        id,
        session_id: sessionId,
      })
      .delete()

    return reply.status(204).send()
  })
}
