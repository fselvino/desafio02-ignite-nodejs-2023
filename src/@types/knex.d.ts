// Essa linha abaixo é para o eslinte ignorar o erro
// eslint-disable-next-line
import knex from 'knex'

declare module 'knex/types/tables' {
  // exporta os campos que a tabela possue
  export interface Tables {
    meals: {
      id: string
      name: string
      description: string
      diet: boolean
      created_at: string
      session_id?: string
    }
    users: {
      id: string
      email: string
    }
  }
}
