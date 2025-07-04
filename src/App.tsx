import { Box, Container, Flex } from '@radix-ui/themes'
import SiderbarNavigation from './components/sidebar-navigation'
import { Route, Routes } from 'react-router'
import Home from './screens/home'
import Copy from './screens/copy'

function App() {
    return (
        <Box style={{ minHeight: '100vh', background: 'var(--gray-1)' }}>
            <Flex>
                {/* SidebarNavigation */}
                <SiderbarNavigation />

                {/* Content */}
                <Box
                    flexGrow='1'
                    style={{
                        background: 'var(--gray-1)',
                        minHeight: '100vh',
                        borderLeft: '1px solid var(--gray-6)'
                    }}
                >
                    <Container size='4' p='6'>
                        <Routes>
                            <Route path='/' element={<Home />} />
                            <Route path='/xlsx' element={<Copy />} />
                        </Routes>
                    </Container>
                </Box>
            </Flex>
        </Box>
    )
}

export default App
