export type Case = {
  id: string
  title: string
  body: string
  tags: string[]
  occurredOn: string
  createdAt: string
  updatedAt: string
}

export type ExportPayload = {
  version: 1
  exportedAt: string
  cases: Case[]
}
