"""doc."""
import sys

import decouple
import uvicorn

#decouple.config = decouple.Config(decouple.RepositoryEnv(sys.argv[1]))

if __name__ == '__main__':
    sys.path.insert(0, '..')
    port = int(decouple.config('PORT'))
    workers = int(decouple.config('WORKERS'))
    uvicorn.run("src.app:app", host=decouple.config('HOST'), port=port, workers=workers, reload=True)
